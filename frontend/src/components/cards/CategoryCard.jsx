import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import SmartImage from '../common/SmartImage';

export default function CategoryCard({ category, size = 'default' }) {
  return (
    <Link to={category.url} className={`category-card category-card--${size}`}>
      <SmartImage src={category.image} alt="" />
      <span className="category-card__shade" />
      <span className="category-card__content">
        <span className="category-card__name">{category.name}</span>
        <span className="category-card__description">{category.description}</span>
      </span>
      <span className="category-card__arrow" aria-hidden="true">
        <ArrowUpRight size={18} />
      </span>
    </Link>
  );
}
