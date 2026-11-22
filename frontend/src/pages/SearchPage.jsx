import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  CornerDownRight,
  Search as SearchIcon,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import SearchBar from '../components/search/SearchBar';
import SearchResultCard from '../components/search/SearchResultCard';
import { AutocorrectBanner, NoResultsSuggestions, PopularSearchLinks } from '../components/search/SearchExtras';
import EmptyState from '../components/common/EmptyState';
import SmartImage from '../components/common/SmartImage';
import Highlight from '../components/search/Highlight';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNews } from '../context/NewsContext';
import { closestWords, correctQuery, searchKnowledge } from '../services/search';
import { categories, difficulties, popularCakes } from '../services/knowledge';
import { tokenize } from '../utils/text';
import { pluralize } from '../utils/format';

const TABS = [
  { id: 'all', label: 'Все' },
  { id: 'cake', label: 'Торты' },
  { id: 'article', label: 'Статьи' },
  { id: 'recipe', label: 'Рецепты' },
  { id: 'video', label: 'Видео' },
  { id: 'news', label: 'Новости' },
  { id: 'term', label: 'Термины' },
];

const SUGGESTED_QUERIES = [
  'Медовик',
  'шоколадный крем',
  'торты без выпечки',
  'как приготовить пышный бисквит',
  'какой торт можно сделать с ягодами',
  'как выровнять торт кремом',
  'виды кремов для декорирования',
];


export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') || '').trim();
  const tab = params.get('tab') || 'all';
  const categoryFilter = params.get('category') || '';
  const difficultyFilter = params.get('difficulty') || '';
  const sort = params.get('sort') || 'relevance';
  const news = useNews();
  const [showFilters, setShowFilters] = useState(Boolean(categoryFilter || difficultyFilter));

  useDocumentTitle(query ? `Поиск: ${query}` : 'Поиск');

  const searchState = useMemo(() => {
    if (!query) return null;
    return searchKnowledge(query, { newsDocs: news.newsDocs });
  }, [query, news.newsDocs]);

  useEffect(() => {
    setShowFilters(Boolean(categoryFilter || difficultyFilter));
  }, [categoryFilter, difficultyFilter]);

  const updateParams = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    setParams(next, { replace: true });
  };

  const filteredResults = useMemo(() => {
    if (!searchState) return [];
    let results = searchState.allResults || searchState.results;
    if (tab !== 'all') results = results.filter((item) => item.doc.type === tab);
    if (categoryFilter) {
      results = results.filter(
        (item) =>
          (item.doc.type === 'cake' || item.doc.type === 'recipe') &&
          (item.doc.meta?.categories || []).includes(categoryFilter),
      );
    }
    if (difficultyFilter) {
      results = results.filter(
        (item) =>
          (item.doc.type === 'cake' || item.doc.type === 'recipe') &&
          item.doc.meta?.difficulty === difficultyFilter,
      );
    }
    if (sort === 'date') {
      results = [...results].sort(
        (a, b) => new Date(b.doc.date || 0).getTime() - new Date(a.doc.date || 0).getTime(),
      );
    } else if (sort === 'alpha') {
      results = [...results].sort((a, b) => a.doc.title.localeCompare(b.doc.title, 'ru'));
    }
    return results;
  }, [searchState, tab, categoryFilter, difficultyFilter, sort]);

  const correction = searchState?.correction || correctQuery(query);
  const correctedQuery = correction.changed ? correction.corrected : '';
  const empty = Boolean(query) && filteredResults.length === 0;
  const similarWords = query ? closestWords(query, 5) : [];
  const queryTokens = useMemo(() => tokenize(query, { stemTokens: true }), [query]);
  const activeFilters = (categoryFilter ? 1 : 0) + (difficultyFilter ? 1 : 0);

  const applySuggestion = (value) => {
    updateParams({ q: value, tab: 'all', category: '', difficulty: '' });
  };

  return (
    <div className="search-page">
      <section className="search-hero">
        <div className="container">
          <p className="eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            Поиск
          </p>
          <h1>Что вы хотите найти?</h1>
          <SearchBar initialValue={query} size="large" />
          <p className="search-hero__hint">
            Поддерживаются слова, словосочетания и целые предложения. Опечатки и неверная
            раскладка исправляются только как подсказка — исходный запрос сохраняется.
          </p>
        </div>
      </section>

      <section className="section search-results-section">
        <div className="container">
          {!query && (
            <div className="search-empty-start">
              <div className="search-empty-start__main">
                <h2>Попробуйте один из запросов</h2>
                <div className="search-examples">
                  {SUGGESTED_QUERIES.map((item) => (
                    <button key={item} type="button" className="search-example" onClick={() => applySuggestion(item)}>
                      <SearchIcon size={15} aria-hidden="true" />
                      {item}
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <h3 className="search-empty-start__subtitle">Популярные категории</h3>
                <PopularSearchLinks />
              </div>
              <aside className="search-empty-start__aside">
                <h2>Популярные материалы</h2>
                <div className="popular-mini-list">
                  {popularCakes.slice(0, 4).map((cake) => (
                    <Link key={cake.id} to={cake.url} className="popular-mini">
                      <SmartImage src={cake.image} alt="" wrapperClassName="popular-mini__image" />
                      <span>
                        <strong>{cake.name}</strong>
                        <small>{cake.categoryNames.join(' · ')}</small>
                      </span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </aside>
            </div>
          )}

          {query && searchState && (
            <>
              <div className="search-summary">
                <div className="search-summary__head">
                  <p>
                    <span className="search-summary__label">По запросу</span>{' '}
                    <strong>«<Highlight text={query} query={query} />»</strong>
                    {empty ? <> — ничего не найдено</> : <> — найдено <strong>{filteredResults.length}</strong> {pluralize(filteredResults.length, 'результат', 'результата', 'результатов')}</>}
                  </p>
                </div>
                {correctedQuery && (
                  <p className="search-summary__correction-note">
                    {correction.layoutApplied ? (
                      <>Похоже, запрос набран в другой раскладке. Результаты найдены по «<Highlight text={correctedQuery} query={query} />».</>
                    ) : (
                      <>Результаты построены с учётом исправления «<Highlight text={correctedQuery} query={query} />», но поиск выполнен по исходному запросу.</>
                    )}
                  </p>
                )}
              </div>

              <AutocorrectBanner
                correction={correction}
                onApply={() => updateParams({ q: correction.corrected, tab: 'all' })}
              />

              <div className="search-tabs-wrap">
                <div className="search-tabs" role="tablist" aria-label="Типы результатов">
                  {TABS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={tab === item.id}
                      className={`search-tab${tab === item.id ? ' is-active' : ''}`}
                      onClick={() => updateParams({ tab: item.id === 'all' ? '' : item.id })}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="search-controls">
                  <button
                    type="button"
                    className={`button button--outline button--small${activeFilters ? ' is-active' : ''}`}
                    onClick={() => setShowFilters((open) => !open)}
                    aria-expanded={showFilters}
                  >
                    <SlidersHorizontal size={15} aria-hidden="true" />
                    Фильтры {activeFilters > 0 && <span className="button__count">{activeFilters}</span>}
                  </button>
                  <label className="field field--select field--small">
                    <span className="visually-hidden">Сортировка</span>
                    <select value={sort} onChange={(event) => updateParams({ sort: event.target.value === 'relevance' ? '' : event.target.value })}>
                      <option value="relevance">По релевантности</option>
                      <option value="date">По дате</option>
                      <option value="alpha">По алфавиту</option>
                    </select>
                    <ChevronDown size={15} aria-hidden="true" />
                  </label>
                </div>
              </div>

              {showFilters && (
                <div className="search-filters">
                  <label className="field field--select">
                    <span>Категория торта</span>
                    <select
                      value={categoryFilter}
                      onChange={(event) => updateParams({ category: event.target.value })}
                    >
                      <option value="">Любая категория</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} aria-hidden="true" />
                  </label>
                  <label className="field field--select">
                    <span>Сложность</span>
                    <select
                      value={difficultyFilter}
                      onChange={(event) => updateParams({ difficulty: event.target.value })}
                    >
                      <option value="">Любая сложность</option>
                      {difficulties.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} aria-hidden="true" />
                  </label>
                  <div className="search-filters__hint">
                    Фильтры категории и сложности применяются к тортам и рецептам.
                  </div>
                  {activeFilters > 0 && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => updateParams({ category: '', difficulty: '' })}
                    >
                      Сбросить фильтры
                    </button>
                  )}
                </div>
              )}

              {filteredResults.length > 0 ? (
                <div className="search-results">
                  {filteredResults.map((result) => (
                    <SearchResultCard
                      key={result.doc.id}
                      result={result}
                      query={query}
                      correctedQuery={correctedQuery}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={query ? 'Похоже, такого материала пока нет' : 'Введите запрос'}
                  description={
                    query
                      ? 'Проверьте запрос, попробуйте более общую формулировку или воспользуйтесь подсказками ниже.'
                      : 'Начните с названия торта, ингредиента или вопроса.'
                  }
                >
                  {query && (
                    <>
                      <NoResultsSuggestions query={query} onPick={applySuggestion} />
                      {similarWords.length > 0 && (
                        <div className="similar-words">
                          <p className="similar-words__label">Похожие слова в базе:</p>
                          <div className="similar-words__list">
                            {similarWords.map((word) => (
                              <button
                                key={`${word.original}-${word.suggestion}`}
                                type="button"
                                className="chip"
                                onClick={() => applySuggestion(word.suggestion)}
                              >
                                <CornerDownRight size={13} aria-hidden="true" />
                                {word.suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="empty-state__popular">
                        <p className="empty-state__popular-label">Популярные материалы</p>
                        <div className="popular-mini-list popular-mini-list--compact">
                          {popularCakes.slice(0, 3).map((cake) => (
                            <Link key={cake.id} to={cake.url} className="popular-mini">
                              <SmartImage src={cake.image} alt="" wrapperClassName="popular-mini__image" />
                              <span>
                                <strong>{cake.name}</strong>
                                <small>{cake.categoryNames.join(' · ')}</small>
                              </span>
                            </Link>
                          ))}
                        </div>
                        <PopularSearchLinks />
                      </div>
                    </>
                  )}
                </EmptyState>
              )}

              {queryTokens.length > 1 && (
                <div className="search-token-note">
                  Запрос разобран на слова: {queryTokens.map((token) => <code key={token}>{token}</code>)} —
                  с учётом словоформ и нечёткого сравнения.
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
