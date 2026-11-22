import { ExternalLink } from 'lucide-react';
import SmartImage from '../common/SmartImage';
import { formatRelativeDate } from '../../utils/format';

export default function NewsCard({ item, variant = 'default' }) {
  return (
    <article className={`news-card news-card--${variant}`}>
      <a className="news-card__media" href={item.link} target="_blank" rel="noopener noreferrer" aria-label={item.title}>
        {item.image ? (
          <SmartImage src={item.image} alt="" />
        ) : (
          <span className="news-card__placeholder" aria-hidden="true">{item.source.slice(0, 2)}</span>
        )}
      </a>
      <div className="news-card__body">
        <div className="news-card__meta">
          <span className="news-card__source">{item.source}</span>
          <span>{item.date ? formatRelativeDate(item.date) : 'дата не указана'}</span>
        </div>
        <h3 className="news-card__title">
          <a href={item.link} target="_blank" rel="noopener noreferrer">
            {item.title}
          </a>
        </h3>
        <p className="news-card__description">{item.description}</p>
        <div className="news-card__footer">
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-link">
            К источнику <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
