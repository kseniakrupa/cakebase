import { Link } from 'react-router-dom';
import { ArrowRight, Clock3 } from 'lucide-react';
import SmartImage from '../common/SmartImage';
import { formatDate } from '../../utils/format';

export default function ArticleCard({ article, variant = 'default' }) {
  return (
    <article className={`article-card article-card--${variant}`}>
      <Link to={article.url} className="article-card__media" aria-label={article.title}>
        <SmartImage src={article.image} alt="" />
      </Link>
      <div className="article-card__body">
        <div className="article-card__meta">
          <span className="article-card__category">{article.category}</span>
          <span>{formatDate(article.publicationDate, { year: false })}</span>
        </div>
        <h3 className="article-card__title">
          <Link to={article.url}>{article.title}</Link>
        </h3>
        <p className="article-card__description">{article.description}</p>
        <div className="article-card__footer">
          <span className="article-card__reading">
            <Clock3 size={14} aria-hidden="true" />
            {article.readingTime} мин чтения
          </span>
          <Link to={article.url} className="text-link" aria-label={`Читать: ${article.title}`}>
            Читать <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
