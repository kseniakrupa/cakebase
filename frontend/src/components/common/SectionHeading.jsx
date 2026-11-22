import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SectionHeading({
  eyebrow,
  title,
  description,
  link,
  linkLabel = 'Смотреть все',
  align = 'left',
  children,
}) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <div className="section-heading__text">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="section-heading__title">{title}</h2>
        {description && <p className="section-heading__description">{description}</p>}
      </div>
      {link && (
        <Link to={link} className="text-link section-heading__link">
          {linkLabel}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
      {children}
    </div>
  );
}
