import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      <ol>
        <li>
          <Link to="/" aria-label="Главная">
            <Home size={14} aria-hidden="true" />
            <span>Главная</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            <ChevronRight size={13} aria-hidden="true" className="breadcrumbs__sep" />
            {item.to && index < items.length - 1 ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
