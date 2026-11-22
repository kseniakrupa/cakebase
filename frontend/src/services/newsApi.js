const API_BASE = import.meta.env.VITE_API_URL || '/api';
const REQUEST_TIMEOUT = 25000;

export const FALLBACK_SOURCES = [
  { id: 'gastronom', name: 'Гастроном', homepage: 'https://www.gastronom.ru', language: 'ru' },
  { id: 'povar', name: 'Повар.ру', homepage: 'https://povar.ru', language: 'ru' },
  { id: 'the-guardian-food', name: 'The Guardian · Food', homepage: 'https://www.theguardian.com/food', language: 'en' },
  { id: 'nyt-dining', name: 'The New York Times · Dining', homepage: 'https://www.nytimes.com/section/dining', language: 'en' },
  { id: 'bon-appetit', name: 'Bon Appétit', homepage: 'https://www.bonappetit.com', language: 'en' },
  { id: 'eater', name: 'Eater', homepage: 'https://www.eater.com', language: 'en' },
  { id: 'bbc-goodfood', name: 'BBC Good Food', homepage: 'https://www.bbcgoodfood.com', language: 'en' },
];

export async function fetchNews({ refresh = false, signal } = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  try {
    const response = await fetch(`${API_BASE}/news${refresh ? '?refresh=true' : ''}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status >= 500) {
        throw new Error('Сервер новостей недоступен. Проверьте, что backend запущен на порту 8000.');
      }
      if (response.status === 404) {
        throw new Error('Эндпоинт /api/news не найден. Проверьте настройки прокси и backend.');
      }
      throw new Error(`API вернул статус ${response.status}`);
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.items)) {
      throw new Error('Неожиданный формат ответа API');
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Сервер новостей не ответил за 25 секунд');
    }
    if (error instanceof TypeError) {
      throw new Error('Не удалось подключиться к серверу новостей. Проверьте, что backend запущен.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
