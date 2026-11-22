import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import SmartImage from '../common/SmartImage';
import MetaRow from '../common/MetaRow';
import { TypeBadge } from '../common/Chip';

export default function CakeCard({ cake, variant = 'default', showTags = true }) {
  return (
    <article className={`cake-card cake-card--${variant}`}>
      <Link to={cake.url} className="cake-card__media" aria-label={`Открыть торт «${cake.name}»`}>
        <SmartImage src={cake.image} alt={`Торт «${cake.name}»`} />
        <span className="cake-card__badge">
          <TypeBadge type="cake" label={cake.type} />
        </span>
        <span className="cake-card__arrow" aria-hidden="true">
          <ArrowUpRight size={16} />
        </span>
      </Link>
      <div className="cake-card__body">
        <p className="cake-card__categories">{cake.categoryNames.join(' · ')}</p>
        <h3 className="cake-card__title">
          <Link to={cake.url}>{cake.name}</Link>
        </h3>
        <p className="cake-card__description">{cake.description}</p>
        <MetaRow
          compact
          time={cake.preparationTime}
          difficulty={cake.difficulty}
          servings={cake.servings}
        />
        {showTags && (
          <div className="cake-card__tags">
            {cake.tags.slice(0, 3).map((tag) => (
              <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="mini-tag">
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
