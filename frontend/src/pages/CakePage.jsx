import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ChefHat,
  Clock3,
  Gauge,
  Lightbulb,
  ListChecks,
  Sparkles,
  Users,
  Utensils,
} from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import SmartImage from '../components/common/SmartImage';
import MetaRow from '../components/common/MetaRow';
import SectionHeading from '../components/common/SectionHeading';
import CakeCard from '../components/cards/CakeCard';
import ArticleCard from '../components/cards/ArticleCard';
import EmptyState from '../components/common/EmptyState';
import Reveal from '../components/common/Reveal';
import KnowledgeGraph from '../components/knowledge/KnowledgeGraph';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  getCakeBySlug,
  getCategory,
  getRelatedArticlesForCake,
  getRelatedCakes,
} from '../services/knowledge';
import { formatMinutes } from '../utils/format';
import { getEntity, getFactsFor, getRecommendationsForCake } from '../services/knowledgeBase';

export default function CakePage() {
  const { slug } = useParams();
  const cake = getCakeBySlug(slug);
  useDocumentTitle(cake?.name || 'Торт не найден');

  if (!cake) {
    return (
      <div className="container section">
        <EmptyState
          title="Такого торта нет в базе"
          description="Возможно, ссылка устарела или в названии опечатка."
          actions={
            <>
              <Link to="/cakes" className="button button--dark">Вернуться в каталог</Link>
              <Link to="/search" className="button button--outline">Найти через поиск</Link>
            </>
          }
        />
      </div>
    );
  }

  const recipe = cake.recipe;
  const relatedCakes = getRelatedCakes(cake, 3);
  const relatedArticles = getRelatedArticlesForCake(cake, 3);
  const categories = cake.categories.map((id) => getCategory(id)).filter(Boolean);
  const kbId = `cake:${cake.id}`;
  const componentFacts = getFactsFor(kbId);
  const componentGroups = [
    { predicate: 'hasBase', label: 'Основа' },
    { predicate: 'hasCream', label: 'Крем' },
    { predicate: 'hasFilling', label: 'Начинка' },
    { predicate: 'hasDecoration', label: 'Декор' },
    { predicate: 'usesTechnique', label: 'Техники' },
  ]
    .map((group) => ({
      ...group,
      items: componentFacts
        .filter((fact) => fact.predicate === group.predicate)
        .map((fact) => getEntity(fact.object))
        .filter(Boolean),
    }))
    .filter((group) => group.items.length);
  const recommendations = getRecommendationsForCake(cake.id);

  return (
    <article className="cake-page">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Торты', to: '/cakes' }, { label: cake.name }]} />
      </div>

      <header className="container cake-hero">
        <div className="cake-hero__media">
          <SmartImage src={cake.image} alt={`Торт «${cake.name}»`} loading="eager" />
          <span className="cake-hero__type">{cake.type}</span>
        </div>
        <div className="cake-hero__content">
          <div className="cake-hero__categories">
            {categories.map((category) => (
              <Link key={category.id} to={category.url} className="chip chip--small">
                {category.name}
              </Link>
            ))}
          </div>
          <h1>{cake.name}</h1>
          <p className="cake-hero__description">{cake.description}</p>
          <dl className="cake-facts">
            <div>
              <dt><Clock3 size={16} aria-hidden="true" /> Время</dt>
              <dd>{formatMinutes(cake.preparationTime)}</dd>
            </div>
            <div>
              <dt><Gauge size={16} aria-hidden="true" /> Сложность</dt>
              <dd>{cake.difficulty}</dd>
            </div>
            <div>
              <dt><Users size={16} aria-hidden="true" /> Порции</dt>
              <dd>{cake.servings}</dd>
            </div>
            <div>
              <dt><ChefHat size={16} aria-hidden="true" /> Рецепт</dt>
              <dd>{recipe ? `${recipe.ingredients.length} ингредиентов` : 'скоро'}</dd>
            </div>
          </dl>
          <div className="cake-hero__tags">
            {cake.tags.map((tag) => (
              <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="mini-tag">
                #{tag}
              </Link>
            ))}
          </div>
          <div className="cake-hero__actions">
            {recipe && (
              <a href="#recipe" className="button button--dark">
                Перейти к рецепту <ArrowRight size={16} aria-hidden="true" />
              </a>
            )}
            <Link to="/cakes" className="button button--outline">
              В каталог
            </Link>
          </div>
          {cake.origin && (
            <p className="cake-hero__origin">
              <Sparkles size={15} aria-hidden="true" />
              {cake.origin}
            </p>
          )}
        </div>
      </header>

      <div className="container cake-layout">
        <div className="cake-main">
          <section className="content-section">
            <h2>О торте</h2>
            {cake.longDescription.split('\n\n').map((paragraph) => (
              <p key={paragraph.slice(0, 30)}>{paragraph}</p>
            ))}
          </section>

          {recipe ? (
            <>
              <section className="content-section" id="recipe">
                <div className="content-section__head">
                  <h2>Ингредиенты</h2>
                  <span className="content-section__note">на {recipe.servings} порций</span>
                </div>
                <div className="ingredients-panel">
                  <ul className="ingredient-list">
                    {recipe.ingredients.map((ingredient) => (
                      <li key={ingredient.name}>
                        <span>{ingredient.name}</span>
                        <strong>{ingredient.amount}</strong>
                      </li>
                    ))}
                  </ul>
                  <div className="ingredients-panel__aside">
                    <p>
                      <ListChecks size={17} aria-hidden="true" />
                      {recipe.ingredients.length} ингредиентов
                    </p>
                    <p>
                      <Clock3 size={17} aria-hidden="true" />
                      {formatMinutes(recipe.preparationTime)}
                    </p>
                    <p>
                      <Utensils size={17} aria-hidden="true" />
                      {recipe.steps.length} этапов
                    </p>
                    <Link to={recipe.url} className="text-link">
                      Отдельная страница рецепта <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </section>

              <section className="content-section">
                <h2>Пошаговое приготовление</h2>
                <ol className="step-list">
                  {recipe.steps.map((step, index) => (
                    <li key={step.slice(0, 24)}>
                      <span className="step-list__number">{String(index + 1).padStart(2, '0')}</span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          ) : (
            <section className="content-section">
              <div className="content-note">
                <BookOpen size={20} aria-hidden="true" />
                <p>Подробный рецепт для этого торта пока готовится. Материал уже доступен в базе знаний.</p>
              </div>
            </section>
          )}

          {cake.tips?.length > 0 && (
            <section className="content-section">
              <h2>Советы кондитера</h2>
              <div className="tips-grid">
                {cake.tips.map((tip, index) => (
                  <div className="tip-card" key={tip}>
                    <span className="tip-card__icon" aria-hidden="true">
                      <Lightbulb size={18} />
                    </span>
                    <p>{tip}</p>
                    <span className="tip-card__number">0{index + 1}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="cake-sidebar">
          {recipe && (
            <div className="sidebar-card sidebar-card--accent">
              <p className="eyebrow">Рецепт</p>
              <h2>{recipe.title}</h2>
              <p>{recipe.description}</p>
              <MetaRow time={recipe.preparationTime} servings={recipe.servings} difficulty={recipe.difficulty} />
              <Link to={recipe.url} className="button button--dark button--full">
                Открыть рецепт <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}

          <div className="sidebar-card">
            <h2 className="sidebar-card__title">Категории</h2>
            <div className="sidebar-card__chips">
              {categories.map((category) => (
                <Link key={category.id} to={category.url} className="chip chip--small">
                  {category.name}
                </Link>
              ))}
              <Link to={`/cakes?type=${encodeURIComponent(cake.type)}`} className="chip chip--small chip--accent">
                {cake.type}
              </Link>
            </div>
          </div>

          {relatedCakes.length > 0 && (
            <div className="sidebar-card">
              <h2 className="sidebar-card__title">Похожие торты</h2>
              <div className="sidebar-list">
                {relatedCakes.map((item) => (
                  <Link key={item.id} to={item.url} className="sidebar-list__item">
                    <SmartImage src={item.image} alt="" wrapperClassName="sidebar-list__image" />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.categoryNames.join(' · ')}</small>
                    </span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="sidebar-card sidebar-card--note">
            <h2 className="sidebar-card__title">Как искать</h2>
            <p>
              Введите в поиск название, ингредиент или целую фразу — например, «торт с ягодами и
              сливочным кремом». Поиск учитывает формы слов и опечатки.
            </p>
            <Link to="/search" className="text-link">
              Открыть поиск <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>

      <section className="section cake-knowledge-section">
        <div className="container">
          <SectionHeading
            eyebrow="Состав и сочетания"
            title="Компоненты и советы"
            description="Основа, крем, начинка, техники и вкусы, которые хорошо работают вместе."
          />
          <div className="cake-knowledge-grid">
            <div className="cake-components">
              {componentGroups.map((group) => (
                <div key={group.predicate} className="cake-component-group">
                  <span className="cake-component-group__label">{group.label}</span>
                  <div className="reasoning-chips">
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        to={item.url || `/search?q=${encodeURIComponent(item.name)}`}
                        className="reason-entity"
                      >
                        <span>{item.name}</span>
                        <small>{{ Base: 'основа', Cream: 'крем', Filling: 'начинка', Technique: 'техника', Decoration: 'декор' }[item.type] || item.type}</small>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="cake-recommendations">
              <h3>С чем сочетается</h3>
              {recommendations.flavors.length > 0 && (
                <p className="cake-recommendations__intro">
                  Вкусовой профиль: {recommendations.flavors.map((flavor) => flavor.name.toLowerCase()).join(', ')}.
                </p>
              )}
              {recommendations.creams.length > 0 && (
                <div className="cake-recommendation">
                  <span className="cake-recommendation__label">Кремы</span>
                  <div className="reasoning-chips">
                    {recommendations.creams.slice(0, 4).map(({ entity, reasons }) => (
                      <Link
                        key={entity.id}
                        to={`/search?q=${encodeURIComponent(entity.name)}`}
                        className="reason-entity"
                        title={reasons.join('; ')}
                      >
                        <span>{entity.name}</span>
                        <small>совместим</small>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {recommendations.fillings.length > 0 && (
                <div className="cake-recommendation">
                  <span className="cake-recommendation__label">Начинки</span>
                  <div className="reasoning-chips">
                    {recommendations.fillings.slice(0, 4).map(({ entity }) => (
                      <Link
                        key={entity.id}
                        to={`/search?q=${encodeURIComponent(entity.name)}`}
                        className="reason-entity"
                      >
                        <span>{entity.name}</span>
                        <small>совместима</small>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {recommendations.reasons.length > 0 && (
                <p className="cake-recommendations__basis">
                  Почему это сочетается: {recommendations.reasons.slice(0, 3).join('; ')}.
                </p>
              )}
              {recommendations.creams.length === 0 && recommendations.fillings.length === 0 && (
                <p className="cake-recommendations__empty">Пока нет проверенных сочетаний для этого торта.</p>
              )}
            </div>
          </div>
          <details className="knowledge-disclosure">
            <summary>Показать связи</summary>
            <KnowledgeGraph entityId={kbId} title="" />
          </details>
        </div>
      </section>

      {relatedArticles.length > 0 && (
        <section className="section cake-related">
          <div className="container">
            <SectionHeading
              eyebrow="Читать дальше"
              title="Связанные материалы"
              description="Техники и разборы, которые пригодятся при приготовлении этого торта."
              link="/articles"
              linkLabel="Все статьи"
            />
            <div className="grid-3">
              {relatedArticles.map((article, index) => (
                <Reveal key={article.id} delay={index * 60}>
                  <ArticleCard article={article} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedCakes.length > 0 && (
        <section className="section cake-related cake-related--sand">
          <div className="container">
            <SectionHeading
              eyebrow="Попробуйте ещё"
              title="Похожие торты"
              link="/cakes"
              linkLabel="Весь каталог"
            />
            <div className="grid-3">
              {relatedCakes.map((item, index) => (
                <Reveal key={item.id} delay={index * 60}>
                  <CakeCard cake={item} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
