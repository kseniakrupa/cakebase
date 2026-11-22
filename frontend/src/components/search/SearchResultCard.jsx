import { Link } from 'react-router-dom';
import { ExternalLink, Play, ArrowUpRight } from 'lucide-react';
import Highlight from './Highlight';
import SmartImage from '../common/SmartImage';
import { formatDate, formatMinutes } from '../../utils/format';
import { TYPE_LABELS } from '../../services/search';

const EXTERNAL_TYPES = new Set(['news', 'video']);

export default function SearchResultCard({ result, query, correctedQuery }) {
  const { doc, matchedFields } = result;
  const external = EXTERNAL_TYPES.has(doc.type) || doc.meta?.external;
  const href = doc.url || '#';
  const title = (
    <>
      <Highlight text={doc.title} query={query} extraWords={[correctedQuery]} />
    </>
  );
  const content = (
    <>
      {doc.image ? (
        <span className="search-result__media">
          <SmartImage src={doc.image} alt="" />
          {doc.type === 'video' && (
            <span className="search-result__play" aria-hidden="true">
              <Play size={16} fill="currentColor" />
            </span>
          )}
        </span>
      ) : (
        <span className={`search-result__media search-result__media--blank search-result__media--${doc.type}`} aria-hidden="true">
          {doc.title.slice(0, 1)}
        </span>
      )}
      <span className="search-result__content">
        <span className="search-result__top">
          <span className={`type-badge type-badge--${doc.type}`}>{TYPE_LABELS[doc.type] || doc.typeLabel}</span>
          <span className="search-result__meta">
            {doc.type === 'cake' && `${formatMinutes(doc.meta?.preparationTime)} · ${doc.meta?.difficulty}`}
            {doc.type === 'recipe' && `${formatMinutes(doc.meta?.preparationTime)} · ${doc.meta?.difficulty}`}
            {doc.type === 'article' && `${doc.subtitle} · ${formatDate(doc.date, { year: false })}`}
            {doc.type === 'video' && `${doc.subtitle} · ${doc.meta?.duration}`}
            {doc.type === 'news' && doc.date && formatDate(doc.date, { year: false })}
            {doc.type === 'term' && doc.subtitle}
            {doc.type === 'category' && 'Раздел каталога'}
          </span>
        </span>
        <span className="search-result__title">{title}</span>
        <span className="search-result__description">
          <Highlight text={doc.description} query={query} extraWords={[correctedQuery]} />
        </span>
        <span className="search-result__bottom">
          {doc.type === 'news' && doc.meta?.source && <span className="search-result__source">{doc.meta.source}</span>}
          {(doc.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="search-result__tag">
              <Highlight text={tag} query={query} extraWords={[correctedQuery]} />
            </span>
          ))}
        </span>
      </span>
      <span className="search-result__arrow" aria-hidden="true">
        {external ? <ExternalLink size={17} /> : <ArrowUpRight size={17} />}
      </span>
    </>
  );

  if (external) {
    return (
      <a className={`search-result search-result--${doc.type}`} href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link className={`search-result search-result--${doc.type}`} to={href}>
      {content}
    </Link>
  );
}
