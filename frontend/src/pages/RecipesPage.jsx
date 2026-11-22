import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import RecipeCard from '../components/cards/RecipeCard';
import EmptyState from '../components/common/EmptyState';
import Reveal from '../components/common/Reveal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { categories, difficulties, recipes } from '../services/knowledge';
import { tokenize, wordsMatch } from '../utils/text';

function recipeMatches(recipe, query) {
  const tokens = tokenize(query, { stemTokens: true });
  if (!tokens.length) return true;
  const haystack = tokenize(
    [
      recipe.title,
      recipe.description,
      ...recipe.tags,
      ...recipe.ingredients.map((item) => item.name),
      recipe.cake?.name || '',
      recipe.cake?.categoryNames.join(' ') || '',
    ].join(' '),
    { stemTokens: true },
  );
  return tokens.every((token) => haystack.some((candidate) => wordsMatch(candidate, token)));
}

export default function RecipesPage() {
  useDocumentTitle('Рецепты');
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const difficulty = params.get('difficulty') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'popular';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const result = recipes.filter((recipe) => {
      if (difficulty && recipe.difficulty !== difficulty) return false;
      if (category && !(recipe.cake?.categories || []).includes(category)) return false;
      if (query && !recipeMatches(recipe, query)) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (sort === 'time') return a.preparationTime - b.preparationTime;
      if (sort === 'name') return a.title.localeCompare(b.title, 'ru');
      return (b.cake?.popularity || 0) - (a.cake?.popularity || 0);
    });
  }, [query, difficulty, category, sort]);

  return (
    <>
      <PageHero
        title="Рецепты"
        accent="с точными граммовками"
        description="Пошаговые рецепты: ингредиенты, время, сложность и порядок действий."
      />

      <section className="section">
        <div className="container">
          <div className="catalog__toolbar">
            <label className="field field--search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={query}
                placeholder="Поиск по рецептам…"
                onChange={(event) => updateParam('q', event.target.value)}
                aria-label="Поиск по рецептам"
              />
            </label>
            <div className="catalog__toolbar-actions">
              <label className="field field--select">
                <span className="visually-hidden">Категория</span>
                <select value={category} onChange={(event) => updateParam('category', event.target.value)}>
                  <option value="">Все категории</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>
              <label className="field field--select">
                <span className="visually-hidden">Сортировка</span>
                <select value={sort} onChange={(event) => updateParam('sort', event.target.value)}>
                  <option value="popular">По популярности</option>
                  <option value="time">Сначала быстрые</option>
                  <option value="name">По названию</option>
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>
            </div>
          </div>

          <div className="filter-chips filter-chips--wide">
            <button
              type="button"
              className={`filter-chip${!difficulty ? ' is-active' : ''}`}
              onClick={() => updateParam('difficulty', '')}
            >
              Любая сложность
            </button>
            {difficulties.map((level) => (
              <button
                key={level}
                type="button"
                className={`filter-chip${difficulty === level ? ' is-active' : ''}`}
                onClick={() => updateParam('difficulty', difficulty === level ? '' : level)}
              >
                {level}
              </button>
            ))}
            <span className="filter-chips__divider" />
            {categories.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`filter-chip${category === item.id ? ' is-active' : ''}`}
                onClick={() => updateParam('category', category === item.id ? '' : item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>

          {filtered.length ? (
            <div className="recipe-grid">
              {filtered.map((recipe, index) => (
                <Reveal key={recipe.id} delay={(index % 3) * 60}>
                  <RecipeCard recipe={recipe} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Рецептов по фильтрам нет"
              description="Попробуйте сбросить сложность или категорию — в базе есть и простые, и сложные торты."
              actions={
                <button type="button" className="button button--dark" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                  Сбросить фильтры
                </button>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}
