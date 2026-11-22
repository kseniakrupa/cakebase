import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/layout/ScrollToTop';
import PageLoader from './components/common/PageLoader';
import { NewsProvider } from './context/NewsContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const CakesPage = lazy(() => import('./pages/CakesPage'));
const CakePage = lazy(() => import('./pages/CakePage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const RecipesPage = lazy(() => import('./pages/RecipesPage'));
const RecipePage = lazy(() => import('./pages/RecipePage'));
const VideosPage = lazy(() => import('./pages/VideosPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const TermPage = lazy(() => import('./pages/TermPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <NewsProvider>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="cakes" element={<CakesPage />} />
            <Route path="cakes/:slug" element={<CakePage />} />
            <Route path="articles" element={<ArticlesPage />} />
            <Route path="articles/:slug" element={<ArticlePage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="recipes/:slug" element={<RecipePage />} />
            <Route path="videos" element={<VideosPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="terms/:id" element={<TermPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </NewsProvider>
  );
}
