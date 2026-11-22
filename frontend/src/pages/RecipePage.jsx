import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  Clock3,
  Gauge,
  Printer,
  RotateCcw,
  Users,
} from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import SmartImage from '../components/common/SmartImage';
import SectionHeading from '../components/common/SectionHeading';
import RecipeCard from '../components/cards/RecipeCard';
import EmptyState from '../components/common/EmptyState';
import Reveal from '../components/common/Reveal';
import CakeCard from '../components/cards/CakeCard';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getRecipeById, getRelatedRecipes } from '../services/knowledge';
import { formatMinutes } from '../utils/format';

export default function RecipePage() {
  const { slug } = useParams();
  const recipe = getRecipeById(slug);
  useDocumentTitle(recipe?.title || 'Рецепт не найден');

  const [checkedIngredients, setCheckedIngredients] = useState([]);
  const [completedSteps, setCompletedSteps] = useState([]);

  const progress = useMemo(() => {
    if (!recipe) return 0;
    return Math.round((completedSteps.length / recipe.steps.length) * 100);
  }, [completedSteps, recipe]);

  if (!recipe) {
    return (
      <div className="container section">
        <EmptyState
          title="Рецепт не найден"
          description="В базе знаний нет рецепта с таким адресом."
          actions={<Link to="/recipes" className="button button--dark">Все рецепты</Link>}
        />
      </div>
    );
  }

  const toggleIngredient = (name) => {
    setCheckedIngredients((previous) =>
      previous.includes(name) ? previous.filter((item) => item !== name) : [...previous, name],
    );
  };

  const toggleStep = (index) => {
    setCompletedSteps((previous) =>
      previous.includes(index) ? previous.filter((item) => item !== index) : [...previous, index],
    );
  };

  const resetProgress = () => {
    setCheckedIngredients([]);
    setCompletedSteps([]);
  };

  const relatedRecipes = getRelatedRecipes(recipe, 3);

  return (
    <article className="recipe-page">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Рецепты', to: '/recipes' },
            { label: recipe.title },
          ]}
        />
      </div>

      <header className="container recipe-hero">
        <div className="recipe-hero__content">
          <p className="eyebrow">Рецепт{recipe.cake ? ` · торт «${recipe.cake.name}»` : ''}</p>
          <h1>{recipe.title}</h1>
          <p className="recipe-hero__description">{recipe.description}</p>
          <dl className="recipe-facts">
            <div>
              <dt><Clock3 size={16} aria-hidden="true" /> Время</dt>
              <dd>{formatMinutes(recipe.preparationTime)}</dd>
            </div>
            <div>
              <dt><Gauge size={16} aria-hidden="true" /> Сложность</dt>
              <dd>{recipe.difficulty}</dd>
            </div>
            <div>
              <dt><Users size={16} aria-hidden="true" /> Порции</dt>
              <dd>{recipe.servings}</dd>
            </div>
            <div>
              <dt><ChefHat size={16} aria-hidden="true" /> Этапов</dt>
              <dd>{recipe.steps.length}</dd>
            </div>
          </dl>
          <div className="recipe-hero__tags">
            {recipe.tags.map((tag) => (
              <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="mini-tag">
                #{tag}
              </Link>
            ))}
          </div>
          <div className="recipe-hero__actions">
            <button type="button" className="button button--dark" onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" /> Распечатать
            </button>
            {recipe.cake && (
              <Link to={recipe.cake.url} className="button button--outline">
                Карточка торта <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
        <div className="recipe-hero__media">
          <SmartImage src={recipe.image} alt="" loading="eager" />
          <span className="recipe-hero__stamp">{recipe.ingredients.length} ингредиентов</span>
        </div>
      </header>

      <div className="container recipe-layout">
        <aside className="recipe-ingredients">
          <div className="recipe-panel">
            <div className="recipe-panel__head">
              <h2>Ингредиенты</h2>
              <span>{recipe.servings} порций</span>
            </div>
            <ul className="check-list">
              {recipe.ingredients.map((ingredient) => {
                const checked = checkedIngredients.includes(ingredient.name);
                return (
                  <li key={ingredient.name}>
                    <label className={checked ? 'is-checked' : ''}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleIngredient(ingredient.name)}
                      />
                      <span className="check-list__box" aria-hidden="true">
                        {checked && <Check size={12} />}
                      </span>
                      <span className="check-list__name">{ingredient.name}</span>
                      <span className="check-list__amount">{ingredient.amount}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="recipe-panel__progress">
              <div className="progress-bar">
                <span style={{ width: `${(checkedIngredients.length / recipe.ingredients.length) * 100}%` }} />
              </div>
              <p>
                Отмечено {checkedIngredients.length} из {recipe.ingredients.length}
                <button type="button" className="text-button" onClick={resetProgress}>
                  <RotateCcw size={13} aria-hidden="true" /> Сбросить
                </button>
              </p>
            </div>
          </div>

          {recipe.cake && (
            <div className="recipe-panel recipe-panel--cake">
              <p className="eyebrow">Торт</p>
              <Link to={recipe.cake.url} className="recipe-panel__cake">
                <SmartImage src={recipe.cake.image} alt="" />
                <span>
                  <strong>{recipe.cake.name}</strong>
                  <small>{recipe.cake.categoryNames.join(' · ')}</small>
                </span>
              </Link>
              <p>{recipe.cake.description}</p>
              <Link to={recipe.cake.url} className="text-link">
                Открыть карточку <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          )}
        </aside>

        <div className="recipe-steps">
          <div className="recipe-steps__head">
            <div>
              <h2>Пошаговое приготовление</h2>
              <p>Отмечайте выполненные шаги — прогресс сохраняется на этой странице.</p>
            </div>
            <div className="recipe-progress">
              <span className="recipe-progress__value">{progress}%</span>
              <div className="progress-bar progress-bar--dark">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
          <ol className="cooking-steps">
            {recipe.steps.map((step, index) => {
              const done = completedSteps.includes(index);
              return (
                <li key={step.slice(0, 26)} className={done ? 'is-done' : ''}>
                  <button
                    type="button"
                    className="cooking-step"
                    onClick={() => toggleStep(index)}
                    aria-pressed={done}
                  >
                    <span className="cooking-step__number">
                      {done ? <Check size={16} /> : String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="cooking-step__text">{step}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="recipe-steps__footer">
            <button type="button" className="button button--outline" onClick={resetProgress}>
              <RotateCcw size={15} aria-hidden="true" /> Начать заново
            </button>
            <Link to="/recipes" className="text-link">
              <ArrowLeft size={15} aria-hidden="true" /> Все рецепты
            </Link>
          </div>
        </div>
      </div>

      {recipe.cake?.tips?.length > 0 && (
        <section className="section recipe-tips">
          <div className="container">
            <SectionHeading eyebrow="Советы" title={`Как приготовить «${recipe.cake.name}»`} />
            <div className="tips-grid">
              {recipe.cake.tips.map((tip, index) => (
                <div className="tip-card" key={tip}>
                  <span className="tip-card__number">0{index + 1}</span>
                  <p>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedRecipes.length > 0 && (
        <section className="section recipe-related">
          <div className="container">
            <SectionHeading eyebrow="Ещё по теме" title="Другие рецепты" link="/recipes" linkLabel="Все рецепты" />
            <div className="grid-3">
              {relatedRecipes.map((item, index) => (
                <Reveal key={item.id} delay={index * 60}>
                  <RecipeCard recipe={item} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {recipe.cake && (
        <section className="section recipe-related recipe-related--sand">
          <div className="container">
            <SectionHeading eyebrow="В каталоге" title="Карточка торта" />
            <div className="single-card-row">
              <CakeCard cake={recipe.cake} />
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
