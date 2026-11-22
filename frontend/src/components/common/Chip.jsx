import { Link } from 'react-router-dom';

export function Chip({ children, to, onClick, active = false, as = 'span', className = '', ...rest }) {
  const classes = `chip${active ? ' chip--active' : ''} ${className}`.trim();
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  if (as === 'button' || onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}

export function Pill({ children, tone = 'neutral', className = '' }) {
  return <span className={`pill pill--${tone} ${className}`.trim()}>{children}</span>;
}

export function TypeBadge({ type, label }) {
  return <span className={`type-badge type-badge--${type}`}>{label}</span>;
}
