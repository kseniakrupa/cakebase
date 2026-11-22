import { Link } from 'react-router-dom';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import Logo from '../common/Logo';

const COLUMNS = [
  {
    title: 'База знаний',
    links: [
      { to: '/cakes', label: 'Каталог тортов' },
      { to: '/categories', label: 'Категории и техники' },
      { to: '/recipes', label: 'Рецепты' },
      { to: '/articles', label: 'Статьи' },
    ],
  },
  {
    title: 'Материалы',
    links: [
      { to: '/videos', label: 'Видеоуроки' },
      { to: '/news', label: 'Новости' },
      { to: '/search?q=%D0%BA%D1%80%D0%B5%D0%BC', label: 'Всё о кремах' },
      { to: '/search?q=%D0%B1%D0%B8%D1%81%D0%BA%D0%B2%D0%B8%D1%82', label: 'Бисквит' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Logo light />
          </div>
          <div className="site-footer__columns">
            {COLUMNS.map((column) => (
              <div key={column.title} className="site-footer__column">
                <h3>{column.title}</h3>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="site-footer__column">
              <h3>О проекте</h3>
              <ul>
                <li>
                  <Link to="/search?q=%D1%88%D0%BE%D0%BA%D0%BE%D0%BB%D0%B0%D0%B4%D0%BD%D1%8B%D0%B9%20%D0%BA%D1%80%D0%B5%D0%BC">
                    Поиск по базе
                  </Link>
                </li>
                <li>
                  <a href="https://www.gastronom.ru" target="_blank" rel="noreferrer noopener">
                    Источник новостей <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a href="https://ru.wikipedia.org/wiki/Торт" target="_blank" rel="noreferrer noopener">
                    Торт в Википедии <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} CakeBase</p>
          <p>
            Изображения: Wikimedia Commons, Flickr (Openverse). Новости — по лицензии источников.
          </p>
          <Link to="/search" className="site-footer__search">
            Найти материал <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
