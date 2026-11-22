import { Link } from 'react-router-dom';

export default function Logo({ compact = false, light = false }) {
  return (
    <Link to="/" className={`logo${light ? ' logo--light' : ''}`} aria-label="CakeBase — на главную">
      <span className="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M5 27.5c0-2.5 2-4.5 4.5-4.5h21c2.5 0 4.5 2 4.5 4.5v3.2c0 1.5-1.2 2.8-2.8 2.8H7.8A2.8 2.8 0 0 1 5 30.7v-3.2Z" fill="currentColor" opacity=".18" />
          <path d="M8.5 23.5v-4.8c0-1.6 1.3-2.9 2.9-2.9h17.2c1.6 0 2.9 1.3 2.9 2.9v4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 15.8v-3.4c0-1.4 1.1-2.5 2.5-2.5h11c1.4 0 2.5 1.1 2.5 2.5v3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M20 9.9V6.5M20 6.5c1.4 0 2.2-1 2.2-2.1C22.2 3.1 21.2 2 20 2s-2.2 1.1-2.2 2.4c0 1.1.8 2.1 2.2 2.1Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M6.5 27.5h27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="logo__text">
        <span className="logo__word">CakeBase</span>
      </span>
    </Link>
  );
}
