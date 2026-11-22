import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Youtube } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import VideoCard from '../components/cards/VideoCard';
import EmptyState from '../components/common/EmptyState';
import Reveal from '../components/common/Reveal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { videoCategories, videos } from '../services/knowledge';
import { tokenize, wordsMatch } from '../utils/text';

function videoMatches(video, query) {
  const tokens = tokenize(query, { stemTokens: true });
  if (!tokens.length) return true;
  const haystack = tokenize([video.title, video.description, video.category, video.channel, ...video.tags].join(' '), {
    stemTokens: true,
  });
  return tokens.every((token) => haystack.some((candidate) => wordsMatch(candidate, token)));
}

export default function VideosPage() {
  useDocumentTitle('Видео');
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const category = params.get('category') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(
    () =>
      videos.filter((video) => {
        if (category && video.category !== category) return false;
        if (query && !videoMatches(video, query)) return false;
        return true;
      }),
    [query, category],
  );

  return (
    <>
      <PageHero
        eyebrow="Видеотека"
        title="Смотреть и"
        accent="повторять"
        description="Рецепты, техники и декоративные приёмы — в тематических роликах с YouTube."
      />

      <section className="section">
        <div className="container">
          <div className="article-toolbar">
            <label className="field field--search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={query}
                placeholder="Поиск по видео…"
                onChange={(event) => updateParam('q', event.target.value)}
                aria-label="Поиск по видео"
              />
            </label>
            <div className="filter-chips">
              <button
                type="button"
                className={`filter-chip${!category ? ' is-active' : ''}`}
                onClick={() => updateParam('category', '')}
              >
                Все темы
              </button>
              {videoCategories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`filter-chip${category === item ? ' is-active' : ''}`}
                  onClick={() => updateParam('category', category === item ? '' : item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="video-note">
            <Youtube size={18} aria-hidden="true" />
            <p>
              Подборка не является официальным каталогом YouTube. Каждая ссылка проверена через
              YouTube oEmbed; права на видео принадлежат авторам каналов.
            </p>
          </div>

          {filtered.length ? (
            <div className="video-grid">
              {filtered.map((video, index) => (
                <Reveal key={video.id} delay={(index % 3) * 60}>
                  <VideoCard video={video} variant={index === 0 && !query && !category ? 'feature' : 'default'} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Видео по такому запросу нет"
              description="Попробуйте другую тему — например, «бисквит», «ганаш» или «декор»."
              actions={
                <button type="button" className="button button--dark" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                  Показать все видео
                </button>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
