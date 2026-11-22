import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Network, Sparkles } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import SmartImage from '../components/common/SmartImage';
import EmptyState from '../components/common/EmptyState';
import KnowledgeGraph from '../components/knowledge/KnowledgeGraph';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getTermById } from '../services/knowledge';
import {
  getEntity,
  getFactRelations,
  getRelatedDocuments,
  PREDICATE_LABELS,
} from '../services/knowledgeBase';

const TYPE_LABELS = {
  Cream: 'крем',
  Base: 'основа',
  Filling: 'начинка',
  Technique: 'техника',
  Ingredient: 'ингредиент',
  Texture: 'текстура',
  Flavor: 'вкус',
  Problem: 'проблема',
  Solution: 'решение',
  Cake: 'торт',
  Article: 'статья',
  Recipe: 'рецепт',
  Term: 'термин',
};

const DOC_LABELS = {
  Cake: 'Торт',
  Article: 'Статья',
  Recipe: 'Рецепт',
  Video: 'Видео',
  Term: 'Термин',
  Category: 'Категория',
};

export default function TermPage() {
  const { id } = useParams();
  const term = getTermById(id);
  const entity = getEntity(`term:${id}`);
  useDocumentTitle(term?.name || 'Термин не найден');

  if (!term || !entity) {
    return (
      <div className="container section">
        <EmptyState
          title="Термин не найден"
          description="В базе знаний нет такого понятия."
          actions={<Link to="/categories" className="button button--dark">Справочник</Link>}
        />
      </div>
    );
  }

  const relations = getFactRelations(entity.id);
  const relatedDocs = getRelatedDocuments(entity.id, 8);
  const relatedEntities = [...new Map(
    [...relations.outgoing, ...relations.incoming]
      .map(({ fact, target, source }) => {
        const other = target || source;
        return other && other.id !== entity.id ? [other.id, { entity: other, fact }] : null;
      })
      .filter(Boolean),
  ).values()].slice(0, 10);

  return (
    <article className="term-page">
      <div className="container">
        <Breadcrumbs items={[{ label: 'Справочник', to: '/categories' }, { label: term.name }]} />
      </div>

      <header className="container term-hero">
        <div>
          <p className="eyebrow">{term.category} · справочник</p>
          <h1>{term.name}</h1>
          <p className="term-hero__summary">{term.summary}</p>
          <div className="term-hero__tags">
            {term.relatedTags.map((tag) => (
              <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="mini-tag">
                #{tag}
              </Link>
            ))}
          </div>
        </div>
        <div className="term-hero__icon" aria-hidden="true">
          <Network size={46} strokeWidth={1.2} />
        </div>
      </header>

      <div className="container term-layout">
        <div className="term-content">
          <section className="content-section">
            <h2>Определение</h2>
            <p>{term.description}</p>
            {term.tips?.length > 0 && (
              <div className="term-tips">
                <h3>Практические замечания</h3>
                <ul>
                  {term.tips.map((tip) => <li key={tip}>{tip}</li>)}
                </ul>
              </div>
            )}
          </section>

          <section className="content-section">
            <h2>Связанные понятия</h2>
            <div className="term-relations">
              {relatedEntities.map(({ entity: related, fact }) => (
                <Link
                  key={`${related.id}-${fact.predicate}`}
                  to={related.url || `/search?q=${encodeURIComponent(related.name)}`}
                  className="term-relation"
                >
                  <span className="term-relation__type">{TYPE_LABELS[related.type] || related.type}</span>
                  <strong>{related.name}</strong>
                  <small>{PREDICATE_LABELS[fact.predicate] || fact.predicate}</small>
                </Link>
              ))}
            </div>
          </section>

          <details className="knowledge-disclosure">
            <summary>Показать связи</summary>
            <KnowledgeGraph entityId={entity.id} title="" />
          </details>
        </div>

        <aside className="term-sidebar">
          <div className="sidebar-card">
            <h2 className="sidebar-card__title">Связанные материалы</h2>
            <div className="sidebar-list">
              {relatedDocs.slice(0, 6).map((doc) => (
                <Link key={doc.id} to={doc.url} className="sidebar-list__item">
                  {doc.image ? (
                    <SmartImage src={doc.image} alt="" wrapperClassName="sidebar-list__image" />
                  ) : (
                    <span className="sidebar-list__icon"><BookOpen size={16} /></span>
                  )}
                  <span>
                    <strong>{doc.name}</strong>
                    <small>{DOC_LABELS[doc.type] || doc.type}</small>
                  </span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>

          <div className="sidebar-card sidebar-card--accent">
            <p className="eyebrow">Поиск</p>
            <h2 className="sidebar-card__title">Найти связанные знания</h2>
            <p>Откройте поиск и проверьте, как понятие используется в рецептах, статьях и связанных материалах.</p>
            <Link to={`/search?q=${encodeURIComponent(term.name)}`} className="button button--dark button--full">
              Искать «{term.name}» <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}
