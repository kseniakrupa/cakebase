import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, Search, X } from 'lucide-react';
import Logo from '../common/Logo';
import SearchBar from '../search/SearchBar';

const NAV_ITEMS = [
  { to: '/cakes', label: 'Торты' },
  { to: '/articles', label: 'Статьи' },
  { to: '/recipes', label: 'Рецепты' },
  { to: '/videos', label: 'Видео' },
  { to: '/news', label: 'Новости' },
  { to: '/categories', label: 'Категории' },
];

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', menuOpen || searchOpen);
    return () => document.body.classList.remove('no-scroll');
  }, [menuOpen, searchOpen]);

  return (
    <>
      <header className="site-header">
        <div className="container site-header__inner">
          <Logo />
          <nav className="site-nav" aria-label="Основная навигация">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `site-nav__link${isActive ? ' is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="site-header__actions">
            <button
              type="button"
              className="header-search-button"
              onClick={() => setSearchOpen(true)}
              aria-label="Открыть поиск"
            >
              <Search size={17} aria-hidden="true" />
              <span>Поиск</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Поиск по базе знаний">
          <button type="button" className="search-overlay__backdrop" onClick={() => setSearchOpen(false)} aria-label="Закрыть поиск" />
          <div className="search-overlay__panel">
            <div className="search-overlay__top">
              <Logo compact />
              <button type="button" className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Закрыть поиск">
                <X size={20} />
              </button>
            </div>
            <SearchBar size="large" autoFocus onClose={() => setSearchOpen(false)} />
            <p className="search-overlay__hint">
              Ищите по тортам, рецептам, статьям, техникам и новостям. Поддерживаются опечатки и запросы предложением.
            </p>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Меню сайта">
          <nav aria-label="Мобильная навигация">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className="mobile-menu__link">
                {item.label}
              </NavLink>
            ))}
          </nav>
          <SearchBar size="default" onClose={() => setMenuOpen(false)} />
          <p className="mobile-menu__tagline">CakeBase — база знаний о кондитерских изделиях</p>
        </div>
      )}
    </>
  );
}
