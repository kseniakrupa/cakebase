import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { getSuggestions } from '../../services/search';
import Highlight from './Highlight';

export function AutocorrectBanner({ correction, onApply }) {
  if (!correction?.changed) return null;
  return (
    <div className="autocorrect" role="status">
      <span className="autocorrect__label">
        {correction.layoutApplied ? 'Похоже, запрос набран в другой раскладке:' : 'Возможно, вы имели в виду:'}
      </span>
      <button type="button" className="autocorrect__suggestion" onClick={onApply}>
        {correction.corrected}
      </button>
      <span className="autocorrect__hint">Запрос не изменён автоматически — можно продолжить поиск по исходному варианту.</span>
    </div>
  );
}

export function NoResultsSuggestions({ query, onPick }) {
  const suggestions = getSuggestions(query, 6);
  if (!suggestions.length) return null;
  return (
    <div className="no-results-suggestions">
      <p className="no-results-suggestions__label">Возможно, вам подойдёт:</p>
      <div className="no-results-suggestions__chips">
        {suggestions.map((suggestion) => (
          <button
            key={`${suggestion.type}-${suggestion.label}`}
            type="button"
            className="chip"
            onClick={() => onPick(suggestion.label)}
          >
            <Highlight text={suggestion.label} query={query} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function PopularSearchLinks() {
  return (
    <div className="popular-links">
      {[
        { label: 'Медовик', q: 'Медовик' },
        { label: 'шоколадный крем', q: 'шоколадный крем' },
        { label: 'торты без выпечки', q: 'торты без выпечки' },
        { label: 'как выровнять торт', q: 'как выровнять торт кремом' },
        { label: 'виды кремов', q: 'виды кремов' },
      ].map((item) => (
        <Link key={item.q} to={`/search?q=${encodeURIComponent(item.q)}`} className="chip">
          {item.label}
        </Link>
      ))}
      <Link to="/categories" className="chip chip--accent">
        Все категории <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}
