import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ExternalLink,
  RefreshCw,
  Rss,
  WifiOff,
} from 'lucide-react';
import PageHero from '../components/common/PageHero';
import NewsCard from '../components/cards/NewsCard';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import Reveal from '../components/common/Reveal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNews } from '../context/NewsContext';
import { formatDateTime } from '../utils/format';

export default function NewsPage() {
  useDocumentTitle('Новости');
  const news = useNews();
  const [params, setParams] = useSearchParams();
  const source = params.get('source') || '';
  const order = params.get('order') || 'new';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const items = useMemo(() => {
    const filtered = source ? news.items.filter((item) => item.sourceId === source) : news.items;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const left = a.date ? new Date(a.date).getTime() : 0;
      const right = b.date ? new Date(b.date).getTime() : 0;
      return order === 'old' ? left - right : right - left;
    });
    return copy;
  }, [news.items, source, order]);

  const sources = news.meta?.sources || news.sources || [];
  const activeSource = sources.find((item) => item.id === source);
  const isLoading = news.status === 'loading';
  const hasItems = items.length > 0;

  return (
    <>
      <PageHero
        title="Свежие"
        accent="кондитерские новости"
        description="Свежие материалы кондитерских изданий. В карточках указан источник, дата и ссылка на оригинальную публикацию."
      />

      <section className="section">
        <div className="container">
          <div className="news-toolbar">
            <div className="news-toolbar__sources" role="group" aria-label="Фильтр по источникам">
              <button
                type="button"
                className={`source-pill${!source ? ' is-active' : ''}`}
                onClick={() => updateParam('source', '')}
              >
                Все источники
              </button>
              {sources.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`source-pill${source === item.id ? ' is-active' : ''}`}
                  onClick={() => updateParam('source', source === item.id ? '' : item.id)}
                  title={item.error || item.homepage}
                >
                  {item.name}
                  <span className={`source-pill__dot source-pill__dot--${item.status}`} />
                </button>
              ))}
            </div>
            <div className="news-toolbar__actions">
              <button
                type="button"
                className="button button--outline button--small"
                onClick={() => updateParam('order', order === 'new' ? 'old' : 'new')}
              >
                {order === 'new' ? <ArrowDownWideNarrow size={15} /> : <ArrowUpWideNarrow size={15} />}
                {order === 'new' ? 'Сначала новые' : 'Сначала старые'}
              </button>
              <button
                type="button"
                className="button button--dark button--small"
                onClick={news.refresh}
                disabled={news.refreshing}
              >
                <RefreshCw size={15} className={news.refreshing ? 'is-spinning' : ''} aria-hidden="true" />
                {news.refreshing ? 'Обновляем…' : 'Обновить ленту'}
              </button>
            </div>
          </div>

          {news.meta?.stale && news.status === 'ready' && (
            <div className="notice notice--warning">
              <AlertTriangle size={18} aria-hidden="true" />
              <p>
                Часть источников сейчас недоступна — показаны сохранённые материалы из кэша сервера.
                {news.meta.errors?.length > 0 && <> Причины: {news.meta.errors.join('; ')}.</>}
              </p>
            </div>
          )}

          {news.status === 'error' && (
            <div className="notice notice--error">
              <WifiOff size={20} aria-hidden="true" />
              <div>
                <strong>Не удалось получить новости</strong>
                <p>{news.error}</p>
                <p>
                  Проверьте, что backend запущен: <code>uvicorn app.main:app --reload</code> в папке
                  <code> backend</code>. Frontend проксирует запросы <code>/api</code> на порт 8000.
                </p>
                <div className="notice__actions">
                  <button type="button" className="button button--dark button--small" onClick={news.refresh}>
                    <RefreshCw size={14} aria-hidden="true" /> Повторить
                  </button>
                  {sources.map((item) => (
                    <a key={item.id} href={item.homepage} target="_blank" rel="noopener noreferrer" className="text-link">
                      {item.name} <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="news-loading">
              <Spinner label="Загружаем ленту с сервера…" />
              <div className="news-loading__grid">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="news-skeleton news-skeleton--card" aria-hidden="true" />
                ))}
              </div>
            </div>
          )}

          {!isLoading && hasItems && (
            <>
              <div className="news-meta-line">
                <span>
                  <Rss size={14} aria-hidden="true" />
                  {activeSource ? activeSource.name : 'Все источники'}
                </span>
                {news.meta?.fetchedAt && (
                  <span>
                    Обновлено: {formatDateTime(news.meta.fetchedAt)}
                    {news.meta.mode === 'cache' && ' · из кэша сервера'}
                  </span>
                )}
              </div>
              <div className="news-grid">
                {items.map((item, index) => (
                  <Reveal key={item.id} delay={(index % 3) * 50}>
                    <NewsCard item={item} />
                  </Reveal>
                ))}
              </div>
            </>
          )}

          {!isLoading && !hasItems && news.status === 'ready' && (
            <EmptyState
              title="Свежих материалов нет"
              description={
                source
                  ? 'У выбранного источника сейчас нет подходящих кондитерских публикаций. Выберите другой источник или обновите ленту.'
                  : 'Источники ответили, но подходящих публикаций не нашлось. Попробуйте обновить ленту позже.'
              }
              actions={
                <button type="button" className="button button--dark" onClick={news.refresh}>
                  <RefreshCw size={15} aria-hidden="true" /> Обновить
                </button>
              }
            />
          )}

        </div>
      </section>
    </>
  );
}
