import { Link } from 'react-router-dom';
import { Compass, Search } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import SearchBar from '../components/search/SearchBar';

export default function NotFoundPage() {
  useDocumentTitle('Страница не найдена');
  return (
    <section className="not-found">
      <div className="container not-found__inner">
        <p className="eyebrow">404</p>
        <h1>Такой страницы нет в базе знаний</h1>
        <p>
          Возможно, ссылка устарела. Попробуйте найти материал через поиск или начните с каталога
          тортов.
        </p>
        <div className="not-found__search">
          <SearchBar />
        </div>
        <div className="not-found__links">
          <Link to="/" className="button button--dark">На главную</Link>
          <Link to="/cakes" className="button button--outline">
            <Compass size={16} aria-hidden="true" /> Каталог тортов
          </Link>
          <Link to="/search" className="button button--ghost">
            <Search size={16} aria-hidden="true" /> Поиск
          </Link>
        </div>
      </div>
    </section>
  );
}
