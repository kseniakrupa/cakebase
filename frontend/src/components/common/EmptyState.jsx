import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon = SearchX,
  title = 'Ничего не нашлось',
  description,
  actions,
  children,
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        <Icon size={26} strokeWidth={1.6} />
      </span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {actions && <div className="empty-state__actions">{actions}</div>}
      {children}
    </div>
  );
}

export function EmptyLinks({ links = [] }) {
  return (
    <div className="empty-state__links">
      {links.map((link) => (
        <Link key={link.to} to={link.to} className="chip">
          {link.label}
        </Link>
      ))}
    </div>
  );
}
