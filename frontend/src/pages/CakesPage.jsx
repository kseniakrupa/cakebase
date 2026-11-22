import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Filter, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import CakeCard from '../components/cards/CakeCard';
import EmptyState from '../components/common/EmptyState';
import Reveal from '../components/common/Reveal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { cakes, categories, cakeTypes, difficulties } from '../services/knowledge';
import { tokenize, wordsMatch } from '../utils/text';
import { difficultyLevel } from '../utils/format';

const SORT_OPTIONS = [
  { value: 'popular', label: 'По популярности' },
  { value: 'name', label: 'По названию' },
  { value: 'time', label: 'Сначала быстрые' },
  { value: 'difficulty', label: 'Сначала простые' },
];

const PAGE_SIZE = 9;

function cakeMatches(cake, query) {
  const tokens = tokenize(query, { stemTokens: true });
  if (!tokens.length) return true;
  const haystack = [
    cake.name,
    cake.description,
    cake.longDescription,
    cake.type,
    ...cake.tags,
    ...cake.categoryNames,
    ...cake.ingredients,
  ].join(' ');
  const haystackTokens = tokenize(haystack, { stemTokens: true });
  return tokens.every((token) => haystackTokens.some((candidate) => wordsMatch(candidate, token)));
}

export default function CakesPage() {
  useDocumentTitle('Каталог тортов');
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const query = params.get('q') || '';
  const selectedCategories = (params.get('category') || '').split(',').filter(Boolean);
  const selectedType = params.get('type') || '';
  const selectedDifficulty = params.get('difficulty') || '';
  const sort = params.get('sort') || 'popular';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
    setVisibleCount(PAGE_SIZE);
  };

  const toggleCategory = (id) => {
    const next = selectedCategories.includes(id)
      ? selectedCategories.filter((item) => item !== id)
      : [...selectedCategories, id];
    updateParam('category', next.join(','));
  };

  const resetFilters = () => {
    setParams(new URLSearchParams(), { replace: true });
    setVisibleCount(PAGE_SIZE);
  };

  const filtered = useMemo(() => {
    const result = cakes.filter((cake) => {
      if (query && !cakeMatches(cake, query)) return false;
      if (selectedCategories.length && !cake.categories.some((id) => selectedCategories.includes(id))) return false;
      if (selectedType && cake.type !== selectedType) return false;
      if (selectedDifficulty && cake.difficulty !== selectedDifficulty) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'ru');
      if (sort === 'time') return a.preparationTime - b.preparationTime;
      if (sort === 'difficulty') return difficultyLevel(a.difficulty) - difficultyLevel(b.difficulty);
      return b.popularity - a.popularity;
    });
  }, [query, selectedCategories, selectedType, selectedDifficulty, sort]);

  const visible = filtered.slice(0, visibleCount);

  const activeFilterCount =
    selectedCategories.length + (selectedType ? 1 : 0) + (selectedDifficulty ? 1 : 0);

  return (
    <>
      <PageHero
        eyebrow="Каталог"
        title="Все торты"
        accent="в одном месте"
        description="Классические и современные торты с категориями, характеристиками и полными рецептами. Фильтруйте по составу, типу и сложности или ищите по названию и ингредиентам."
      />

      <section className="catalog section">
        <div className="container">
          <div className="catalog__toolbar">
            <label className="field field--search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={query}
                placeholder="Поиск по каталогу…"
                onChange={(event) => updateParam('q', event.target.value)}
                aria-label="Поиск по каталогу тортов"
              />
              {query && (
                <button type="button" className="field__clear" onClick={() => updateParam('q', '')} aria-label="Очистить поиск">
                  ×
                </button>
              )}
            </label>
            <div className="catalog__toolbar-actions">
              <button
                type="button"
                className={`button button--outline button--filters${filtersOpen ? ' is-active' : ''}`}
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                Фильтры
                {activeFilterCount > 0 && <span className="button__count">{activeFilterCount}</span>}
              </button>
              <label className="field field--select">
                <span className="visually-hidden">Сортировка</span>
                <select value={sort} onChange={(event) => updateParam('sort', event.target.value)}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>
            </div>
          </div>

          <div className={`catalog__layout${filtersOpen ? ' catalog__layout--open' : ''}`}>
            <aside className="catalog-filters" aria-label="Фильтры каталога">
              <div className="catalog-filters__head">
                <h2>
                  <Filter size={16} aria-hidden="true" /> Фильтры
                </h2>
                {activeFilterCount > 0 && (
                  <button type="button" className="text-button" onClick={resetFilters}>
                    <RotateCcw size={14} aria-hidden="true" /> Сбросить
                  </button>
                )}
              </div>

              <fieldset className="filter-group">
                <legend>Категория</legend>
                <div className="filter-chips">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`filter-chip${selectedCategories.includes(category.id) ? ' is-active' : ''}`}
                      aria-pressed={selectedCategories.includes(category.id)}
                      onClick={() => toggleCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="filter-group">
                <legend>Тип торта</legend>
                <div className="filter-chips">
                  {cakeTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`filter-chip${selectedType === type ? ' is-active' : ''}`}
                      aria-pressed={selectedType === type}
                      onClick={() => updateParam('type', selectedType === type ? '' : type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="filter-group">
                <legend>Сложность</legend>
                <div className="filter-chips">
                  {difficulties.map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      className={`filter-chip${selectedDifficulty === difficulty ? ' is-active' : ''}`}
                      aria-pressed={selectedDifficulty === difficulty}
                      onClick={() => updateParam('difficulty', selectedDifficulty === difficulty ? '' : difficulty)}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="catalog-filters__note">
                <strong>Совет</strong>
                <p>Один торт может относиться к нескольким категориям — например, «Медовик» одновременно медовый и слоёный.</p>
              </div>
            </aside>

            <div className="catalog__results">
              <div className="catalog__summary">
                <p>{query ? <>Результаты по запросу «{query}»</> : 'Каталог тортов'}</p>
                {activeFilterCount > 0 && (
                  <button type="button" className="text-button" onClick={resetFilters}>
                    Сбросить фильтры
                  </button>
                )}
              </div>

              {visible.length > 0 ? (
                <>
                  <div className="cake-grid">
                    {visible.map((cake, index) => (
                      <Reveal key={cake.id} delay={(index % 3) * 60}>
                        <CakeCard cake={cake} />
                      </Reveal>
                    ))}
                  </div>
                  {visibleCount < filtered.length && (
                    <div className="load-more">
                      <button
                        type="button"
                        className="button button--dark"
                        onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                      >
                        Показать ещё
                        <ChevronDown size={16} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  title="Таких тортов не нашлось"
                  description="Попробуйте упростить запрос, убрать часть фильтров или перейти к популярным категориям."
                  actions={
                    <>
                      <button type="button" className="button button--dark" onClick={resetFilters}>
                        Сбросить фильтры
                      </button>
                      <Link to="/categories" className="button button--outline">
                        Все категории
                      </Link>
                    </>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
