import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock3,
  Lightbulb,
  Newspaper,
  Quote,
  Sparkles,
} from 'lucide-react';
import SearchBar from '../components/search/SearchBar';
import SectionHeading from '../components/common/SectionHeading';
import Reveal from '../components/common/Reveal';
import SmartImage from '../components/common/SmartImage';
import CategoryCard from '../components/cards/CategoryCard';
import CakeCard from '../components/cards/CakeCard';
import ArticleCard from '../components/cards/ArticleCard';
import RecipeCard from '../components/cards/RecipeCard';
import VideoCard from '../components/cards/VideoCard';
import NewsCard from '../components/cards/NewsCard';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNews } from '../context/NewsContext';
import {
  articles,
  categories,
  featuredRecipes,
  popularCakes,
  terms,
  videos,
} from '../services/knowledge';

const POPULAR_QUERIES = [
  'Медовик',
  'шоколадный крем',
  'торты без выпечки',
  'как выровнять торт',
];

const TIPS = [
  {
    title: 'Температура важнее времени',
    text: 'Термометр превращает сироп, карамель и шоколад из лотереи в управляемый процесс. Он окупается уже на втором торте.',
  },
  {
    title: 'Холод — часть рецепта',
    text: 'Бисквит, чизкейк и мусс стабилизируются в холодильнике. Нарезка тёплого торта почти всегда портит текстуру.',
  },
  {
    title: 'Баланс, а не количество',
    text: 'Щепотка соли и немного кислоты часто делают больше, чем ещё сто граммов сахара. Пробуйте крем до сборки.',
  },
];

export default function HomePage() {
  useDocumentTitle(null);
  const news = useNews();
  const highlightCategories = categories.slice(0, 5);
  const topCakes = popularCakes.slice(0, 4);
  const homeArticles = articles.slice(0, 3);
  const homeVideos = videos.slice(0, 3);
  const homeNews = news.items.slice(0, 3);

  return (
    <>
      <section className="home-hero">
        <div className="container home-hero__grid">
          <div className="home-hero__content">
            <p className="eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              Кондитерские изделия
            </p>
            <h1 className="home-hero__title">
              Мир тортов,
              <br />
              <em>собранный по кусочкам.</em>
            </h1>
            <p className="home-hero__lead">
              Каталог тортов, рецептов, техник и статей. Ищите словами, словосочетаниями и целыми
              предложениями — даже если точное название вылетело из головы.
            </p>
            <SearchBar size="large" placeholder="Например: медовик, крем…" />
            <div className="home-hero__quick">
              <span>Попробуйте:</span>
              {POPULAR_QUERIES.map((query) => (
                <Link key={query} to={`/search?q=${encodeURIComponent(query)}`} className="chip chip--ghost">
                  {query}
                </Link>
              ))}
            </div>
          </div>

          <div className="home-hero__visual">
            <div className="home-hero__image">
              <SmartImage
                src="/images/hero.jpg"
                alt="Торт с ягодами и кремом на кондитерском столе"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <Link to="/cakes/medovik" className="hero-recipe-card">
              <span className="hero-recipe-card__label">Рецепт дня</span>
              <strong>Медовик</strong>
              <span className="hero-recipe-card__meta">
                <Clock3 size={13} aria-hidden="true" /> 4 часа · средний
              </span>
              <ArrowUpRight size={18} aria-hidden="true" className="hero-recipe-card__arrow" />
            </Link>
            <Link to="/categories" className="hero-note-card">
              <BookOpen size={18} aria-hidden="true" />
              <span>
                <strong>Техники</strong> от ганаша до темперирования
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section home-categories">
        <div className="container">
          <SectionHeading
            eyebrow="Навигация по вкусу"
            title="Популярные категории"
            description="От классических бисквитов до холодных чизкейков — найдите свой раздел."
            link="/categories"
            linkLabel="Все категории"
          />
          <div className="home-categories__grid">
            {highlightCategories.map((category, index) => (
              <Reveal key={category.id} delay={index * 50}>
                <CategoryCard category={category} size={index === 0 ? 'large' : 'default'} />
              </Reveal>
            ))}
          </div>
          <div className="home-categories__more">
            {categories.slice(5).map((category) => (
              <Link key={category.id} to={category.url} className="category-chip">
                {category.name}
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-cakes">
        <div className="container">
          <SectionHeading
            eyebrow="Каталог"
            title="Торты, которые стоит знать"
            description="Проверенные классические и современные торты с подробными карточками и рецептами."
            link="/cakes"
            linkLabel="Открыть каталог"
          />
          <div className="home-cakes__grid">
            {topCakes.map((cake, index) => (
              <Reveal key={cake.id} delay={index * 60}>
                <CakeCard cake={cake} variant={index === 0 ? 'portrait' : 'default'} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-journal">
        <div className="container">
          <SectionHeading
            eyebrow="Журнал CakeBase"
            title="Новые статьи"
            description="Разборы техник, ошибок и ингредиентов — без воды и мифов."
            link="/articles"
            linkLabel="Все статьи"
          />
          <div className="home-journal__grid">
            <div className="home-journal__feature">
              {homeArticles[0] && (
                <Reveal>
                  <ArticleCard article={homeArticles[0]} variant="feature" />
                </Reveal>
              )}
            </div>
            <div className="home-journal__list">
              {homeArticles.slice(1).map((article, index) => (
                <Reveal key={article.id} delay={index * 70}>
                  <ArticleCard article={article} variant="row" />
                </Reveal>
              ))}
              <Reveal delay={140}>
                <Link to="/articles" className="journal-index-link">
                  <span>
                    <strong>Все материалы журнала</strong>
                    <small>Технологии, кремы, практика и история</small>
                  </span>
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-recipes">
        <div className="container">
          <SectionHeading
            eyebrow="Пошагово"
            title="Подборка рецептов"
            description="Точные граммовки, порядок действий и время — чтобы результат совпал с ожиданием."
            link="/recipes"
            linkLabel="Все рецепты"
          />
          <div className="home-recipes__grid">
            {featuredRecipes.map((recipe, index) => (
              <Reveal key={recipe.id} delay={index * 60}>
                <RecipeCard recipe={recipe} />
              </Reveal>
            ))}
          </div>
          <div className="recipe-index-row">
            {['торт на день рождения', 'быстрый десерт', 'шоколадный торт', 'чизкейк'].map((query) => (
              <Link key={query} to={`/search?q=${encodeURIComponent(query)}`} className="chip">
                {query}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-news">
        <div className="container home-news__grid">
          <div className="home-news__intro">
            <p className="eyebrow">
              <Newspaper size={14} aria-hidden="true" />
              Внешние источники
            </p>
            <h2>Что происходит в кондитерском мире</h2>
            <p>
              Новости загружаются с сервера из RSS-лент тематических изданий. Материалы принадлежат
              источникам — ссылки ведут на оригиналы.
            </p>
            <div className="home-news__actions">
              <Link to="/news" className="button button--dark">
                Все новости <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <span className={`status-pill status-pill--${news.status}`}>
                <span className="status-pill__dot" />
                {news.status === 'loading' && 'загрузка'}
                {news.status === 'ready' && news.meta?.mode === 'live' && 'живая лента'}
                {news.status === 'ready' && news.meta?.mode !== 'live' && 'кэш сервера'}
                {news.status === 'error' && 'нет соединения'}
              </span>
            </div>
            <div className="home-news__sources">
              {(news.meta?.sources || []).slice(0, 5).map((source) => (
                <a key={source.id} href={source.homepage} target="_blank" rel="noopener noreferrer">
                  {source.name}
                </a>
              ))}
            </div>
            {news.status === 'error' && (
              <p className="home-news__error">
                Лента недоступна: {news.error}. Запустите backend и повторите загрузку на странице
                новостей.
              </p>
            )}
          </div>
          <div className="home-news__list">
            {news.status === 'loading' &&
              [0, 1, 2].map((item) => <div key={item} className="news-skeleton" aria-hidden="true" />)}
            {news.status === 'error' && (
              <div className="home-news__fallback">
                <span>
                  <Newspaper size={20} aria-hidden="true" />
                </span>
                <div>
                  <strong>Новости временно недоступны</strong>
                  <p>
                    Проверьте, что backend запущен на порту 8000. Пока можно изучить материалы базы
                    знаний и источники напрямую.
                  </p>
                  <div className="home-news__fallback-links">
                    <Link to="/articles" className="text-link">Статьи</Link>
                    <Link to="/recipes" className="text-link">Рецепты</Link>
                  </div>
                </div>
              </div>
            )}
            {news.status === 'ready' &&
              homeNews.map((item, index) => (
                <Reveal key={item.id} delay={index * 60}>
                  <NewsCard item={item} variant="row" />
                </Reveal>
              ))}
            {news.status === 'ready' && !homeNews.length && (
              <p className="home-news__empty">Свежих кондитерских материалов сейчас нет — попробуйте обновить ленту позже.</p>
            )}
          </div>
        </div>
      </section>

      <section className="home-section home-videos">
        <div className="container">
          <SectionHeading
            eyebrow="Смотреть"
            title="Видеоматериалы"
            description="Реальные ролики с YouTube: рецепты, техники и декоративные приёмы."
            link="/videos"
            linkLabel="Все видео"
          />
          <div className="home-videos__grid">
            {homeVideos.map((video, index) => (
              <Reveal key={video.id} delay={index * 60}>
                <VideoCard video={video} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-alphabet">
        <div className="container home-alphabet__grid">
          <div className="home-alphabet__intro">
            <p className="eyebrow">
              <Lightbulb size={14} aria-hidden="true" />
              Полезные советы
            </p>
            <h2>Кондитерская азбука</h2>
            <p>
              Небольшие правила, которые заметно меняют результат. Больше — в разделе техник и
              справочных терминов.
            </p>
            <Link to="/categories" className="button button--outline">
              Открыть справочник <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="tip-list">
            {TIPS.map((tip, index) => (
              <Reveal key={tip.title} className="tip-item" delay={index * 70}>
                <span className="tip-item__number">0{index + 1}</span>
                <div>
                  <h3>{tip.title}</h3>
                  <p>{tip.text}</p>
                </div>
                <Lightbulb size={18} aria-hidden="true" className="tip-item__icon" />
              </Reveal>
            ))}
          </div>
        </div>
        <div className="container home-alphabet__terms">
          {terms.slice(0, 8).map((term) => (
            <Link key={term.id} to={`/terms/${term.id}`} className="term-chip">
              <span>{term.name}</span>
              <small>{term.category}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-quote">
        <div className="container home-quote__inner">
          <Quote size={34} aria-hidden="true" className="home-quote__icon" />
          <blockquote>
            «Хороший торт — это не самый сладкий и не самый сложный. Это торт, в котором каждый слой
            знает, зачем он здесь».
          </blockquote>
          <cite>Редакция CakeBase</cite>
          <div className="home-quote__related">
            <Link to="/articles/balans-vkusa" className="text-link">
              Читать о балансе вкуса <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link to="/search" className="text-link">
              Перейти к поиску <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-contact-strip">
        <div className="container home-contact-strip__inner">
          <div>
            <p className="eyebrow">Не знаете, с чего начать?</p>
            <h2>Опишите торт словами — поиск разберётся.</h2>
          </div>
          <div className="home-contact-strip__search">
            <SearchBar size="default" placeholder="торт с ягодами и сливочным кремом" />
            <p>
              Примеры: <Link to="/search?q=%D0%B1%D0%B8%D1%81%D0%BA%D0%B2%D0%B8%D1%82">бисквит</Link>,{' '}
              <Link to="/search?q=%D0%B3%D0%B0%D0%BD%D0%B0%D1%88">ганаш</Link>,{' '}
              <Link to="/search?q=%D0%B1%D0%B5%D0%B7%20%D0%B2%D1%8B%D0%BF%D0%B5%D1%87%D0%BA%D0%B8">без выпечки</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
