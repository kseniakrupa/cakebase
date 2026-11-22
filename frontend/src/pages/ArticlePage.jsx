import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Clock3, ExternalLink, Quote } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import SmartImage from '../components/common/SmartImage';
import SectionHeading from '../components/common/SectionHeading';
import CakeCard from '../components/cards/CakeCard';
import EmptyState from '../components/common/EmptyState';
import Reveal from '../components/common/Reveal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  articles,
  getArticleBySlug,
  getRelatedCakesForArticle,
} from '../services/knowledge';
import { formatDate } from '../utils/format';

function ContentBlock({ block }) {
  if (block.type === 'h2') return <h2>{block.text}</h2>;
  if (block.type === 'ul') {
    return (
      <ul className="article-list">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.type === 'tip') {
    return (
      <aside className="article-tip">
        <span className="article-tip__icon" aria-hidden="true">
          <BookOpen size={18} />
        </span>
        <p>{block.text}</p>
      </aside>
    );
  }
  if (block.type === 'quote') {
    return (
      <blockquote className="article-quote">
        <Quote size={22} aria-hidden="true" />
        <p>{block.text}</p>
      </blockquote>
    );
  }
  return <p>{block.text}</p>;
}

export default function ArticlePage() {
  const { slug } = useParams();
  const article = getArticleBySlug(slug);
  useDocumentTitle(article?.title || 'Статья не найдена');

  if (!article) {
    return (
      <div className="container section">
        <EmptyState
          title="Статья не найдена"
          description="Возможно, она перемещена или ссылка содержит опечатку."
          actions={
            <>
              <Link to="/articles" className="button button--dark">Все статьи</Link>
              <Link to="/search" className="button button--outline">Поиск по базе</Link>
            </>
          }
        />
      </div>
    );
  }

  const relatedCakes = getRelatedCakesForArticle(article, 3);
  const relatedArticles = articles
    .filter((item) => item.id !== article.id)
    .map((item) => ({
      item,
      score:
        (item.category === article.category ? 3 : 0) +
        item.tags.filter((tag) => article.tags.includes(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.item);

  return (
    <article className="article-page">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Статьи', to: '/articles' }, { label: article.title }]} />
      </div>

      <header className="container article-hero">
        <div className="article-hero__text">
          <Link to={`/articles?category=${encodeURIComponent(article.category)}`} className="chip chip--accent">
            {article.category}
          </Link>
          <h1>{article.title}</h1>
          <p className="article-hero__description">{article.description}</p>
          <div className="article-hero__meta">
            <span>{formatDate(article.publicationDate)}</span>
            <span><Clock3 size={14} aria-hidden="true" /> {article.readingTime} мин чтения</span>
            <span>{article.author}</span>
          </div>
          <div className="article-hero__tags">
            {article.tags.map((tag) => (
              <Link key={tag} to={`/articles?tag=${encodeURIComponent(tag)}`} className="mini-tag">
                #{tag}
              </Link>
            ))}
          </div>
        </div>
        <div className="article-hero__media">
          <SmartImage src={article.image} alt="" loading="eager" />
        </div>
      </header>

      <div className="container article-layout">
        <div className="article-content">
          {article.content.map((block, index) => (
            <ContentBlock key={`${block.type}-${index}`} block={block} />
          ))}
          {article.sources?.length > 0 && (
            <section className="article-sources" aria-labelledby="article-sources-title">
              <span className="eyebrow">Проверка фактов</span>
              <h2 id="article-sources-title">Источники</h2>
              <ol className="article-sources__list">
                {article.sources.map((source, index) => (
                  <li key={`${source.title}-${index}`} className="article-sources__item">
                    <span className="article-sources__index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      {source.url ? (
                        <a
                          className="article-sources__link"
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {source.title}
                          <ExternalLink size={13} aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="article-sources__title">{source.title}</span>
                      )}
                      <p className="article-sources__meta">
                        {[source.author, source.publisher, source.year].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="article-sources__note">
                Источники использованы для проверки фактов и дополнительного чтения. Текст статьи — авторский.
              </p>
            </section>
          )}

          <div className="article-content__footer">
            <Link to="/articles" className="text-link">
              <ArrowLeft size={15} aria-hidden="true" /> Все статьи
            </Link>
            <Link to="/search" className="text-link">
              Найти материалы по теме <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <aside className="article-sidebar">
          <div className="sidebar-card">
            <h2 className="sidebar-card__title">Материалы по теме</h2>
            <div className="sidebar-list">
              {relatedArticles.map((item) => (
                <Link key={item.id} to={item.url} className="sidebar-list__item sidebar-list__item--text">
                  <span>
                    <small>{item.category}</small>
                    <strong>{item.title}</strong>
                  </span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
          <div className="sidebar-card sidebar-card--accent">
            <p className="eyebrow">Поиск</p>
            <h2 className="sidebar-card__title">Нужен конкретный торт?</h2>
            <p>Найдите его по вкусу, ингредиенту или технике — даже если не помните название.</p>
            <Link to="/search" className="button button--dark button--full">
              Открыть поиск <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>

      {relatedCakes.length > 0 && (
        <section className="section article-related">
          <div className="container">
            <SectionHeading
              eyebrow="Практика"
              title="Торты по теме статьи"
              link="/cakes"
              linkLabel="Весь каталог"
            />
            <div className="grid-3">
              {relatedCakes.map((cake, index) => (
                <Reveal key={cake.id} delay={index * 60}>
                  <CakeCard cake={cake} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
