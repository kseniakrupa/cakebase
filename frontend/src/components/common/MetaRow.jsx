import { Clock3, Users, Gauge } from 'lucide-react';
import { formatMinutes } from '../../utils/format';

export default function MetaRow({ time, servings, difficulty, className = '', compact = false }) {
  return (
    <div className={`meta-row ${compact ? 'meta-row--compact' : ''} ${className}`.trim()}>
      {time !== undefined && (
        <span className="meta-row__item">
          <Clock3 size={14} aria-hidden="true" />
          {formatMinutes(time)}
        </span>
      )}
      {difficulty && (
        <span className="meta-row__item">
          <Gauge size={14} aria-hidden="true" />
          {difficulty}
        </span>
      )}
      {servings !== undefined && (
        <span className="meta-row__item">
          <Users size={14} aria-hidden="true" />
          {servings} порц.
        </span>
      )}
    </div>
  );
}
