import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import ArticleCard from '../components/cards/ArticleCard';
import EmptyState from '../components/common/EmptyState';
import Reveal from '../components/common/Reveal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { articleCategories, articles } from '../services/knowledge';
import { tokenize, wordsMatch } from '../utils/text';

function articleMatches(article, query) {
  const tokens = tokenize(query, { stemTokens: true });
  if (!tokens.length) return true;
  const haystack = tokenize(
    [article.title, article.description, article.category, ...article.tags, ...article.content.map((block) => block.text || (block.items || []).join(' '))].join(' '),
    { stemTokens: true },
  );
  return tokens.every((token) => haystack.some((candidate) => wordsMatch(candidate, token)));
}

export default function ArticlesPage() {
  useDocumentTitle('Статьи');
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const category = params.get('category') || '';
  const tag = params.get('tag') || '';

  const allTags = useMemo(() => {
    const counts = new Map();
    articles.forEach((article) => article.tags.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
  }, []);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(
    () =>
      articles.filter((article) => {
        if (category && article.category !== category) return false;
        if (tag && !article.tags.includes(tag)) return false;
        if (query && !articleMatches(article, query)) return false;
        return true;
      }),
    [category, tag, query],
  );

  const featured = !query && !category && !tag ? filtered[0] : null;
  const rest = featured ? filtered.slice(1) : filtered;
  const hasFilters = Boolean(query || category || tag);

  return (
    <>
      <PageHero
        eyebrow="Журнал"
        title="Статьи о кондитерском"
        accent="ремесле"
        description="Технологии, кремы, ингредиенты и практические разборы — с пояснениями и примерами."
      />

      <section className="section">
        <div className="container">
          <div className="article-toolbar">
            <label className="field field--search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={query}
                placeholder="Поиск по статьям…"
                onChange={(event) => updateParam('q', event.target.value)}
                aria-label="Поиск по статьям"
              />
            </label>
            <div className="filter-chips">
              <button
                type="button"
                className={`filter-chip${!category ? ' is-active' : ''}`}
                onClick={() => updateParam('category', '')}
              >
                Все рубрики
              </button>
              {articleCategories.map((item) => (
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

          <div className="tag-bar">
            <span className="tag-bar__label">Теги:</span>
            {allTags.map(([item]) => (
              <button
                key={item}
                type="button"
                className={`tag-button${tag === item ? ' is-active' : ''}`}
                onClick={() => updateParam('tag', tag === item ? '' : item)}
              >
                {item}
              </button>
            ))}
            {hasFilters && (
              <button
                type="button"
                className="tag-button tag-button--reset"
                onClick={() => setParams(new URLSearchParams(), { replace: true })}
              >
                <X size={13} aria-hidden="true" /> Сбросить
              </button>
            )}
          </div>

          {featured && (
            <Reveal className="article-featured">
              <ArticleCard article={featured} variant="feature-large" />
            </Reveal>
          )}

          {rest.length > 0 ? (
            <div className="article-grid">
              {rest.map((article, index) => (
                <Reveal key={article.id} delay={(index % 3) * 60}>
                  <ArticleCard article={article} />
                </Reveal>
              ))}
            </div>
          ) : (
            !featured && (
              <EmptyState
                title="Статей по такому запросу нет"
                description="Попробуйте другую формулировку или сбросьте теги и рубрику."
                actions={
                  <button type="button" className="button button--dark" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                    Показать все статьи
                  </button>
                }
              />
            )
          )}
          {!filtered.length && (
            <p className="catalog__hint">
              <Link to="/categories" className="text-link">Перейти к справочнику техник</Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
