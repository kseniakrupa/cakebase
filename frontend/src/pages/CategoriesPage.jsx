import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookMarked, Sparkles } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import CategoryCard from '../components/cards/CategoryCard';
import SectionHeading from '../components/common/SectionHeading';
import Reveal from '../components/common/Reveal';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  cakeTypes,
  categories,
  getTermById,
  termCategories,
  terms,
} from '../services/knowledge';

const TAB_ICONS = {
  Кремы: '01',
  Ингредиенты: '02',
  Техники: '03',
};

export default function CategoriesPage() {
  useDocumentTitle('Категории и техники');
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Кремы');

  const hashTerm = useMemo(() => {
    if (!location.hash) return null;
    return getTermById(location.hash.slice(1));
  }, [location.hash]);

  useEffect(() => {
    if (hashTerm) {
      setActiveTab(hashTerm.category);
      const timer = window.setTimeout(() => {
        document.getElementById(hashTerm.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [hashTerm]);

  const visibleTerms = terms.filter((term) => term.category === activeTab);

  return (
    <>
      <PageHero
        eyebrow="Справочник"
        title="Категории, кремы"
        accent="и техники"
        description="Разделы каталога, типы тортов, виды кремов, ключевые ингредиенты и кондитерские техники."
      />

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Каталог"
            title="Категории тортов"
            description="Один торт может входить в несколько категорий — например, «Чёрный лес» одновременно шоколадный и ягодный."
            link="/cakes"
            linkLabel="Открыть каталог"
          />
          <div className="category-grid">
            {categories.map((category, index) => (
              <Reveal key={category.id} delay={(index % 4) * 50}>
                <CategoryCard category={category} size={index === 0 ? 'wide' : 'default'} />
              </Reveal>
            ))}
          </div>

          <div className="type-strip">
            <div className="type-strip__intro">
              <Sparkles size={18} aria-hidden="true" />
              <div>
                <h3>Типы тортов</h3>
                <p>Фильтр по способу приготовления и конструкции.</p>
              </div>
            </div>
            <div className="type-strip__items">
              {cakeTypes.map((type) => (
                <Link key={type} to={`/cakes?type=${encodeURIComponent(type)}`} className="type-tile">
                  <span className="type-tile__name">{type}</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section--sand">
        <div className="container">
          <SectionHeading
            eyebrow="Азбука кондитера"
            title="Справочник терминов"
            description="Кремы, ингредиенты и техники, на которые опираются рецепты. Нажмите на тег, чтобы найти связанные материалы."
          />
          <div className="taxonomy-tabs" role="tablist" aria-label="Разделы справочника">
            {termCategories.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={activeTab === category}
                className={`taxonomy-tab${activeTab === category ? ' is-active' : ''}`}
                onClick={() => setActiveTab(category)}
              >
                <span>{TAB_ICONS[category]}</span>
                {category}
              </button>
            ))}
          </div>

          <div className="term-grid">
            {visibleTerms.map((term, index) => (
              <Reveal key={term.id} delay={(index % 2) * 50}>
                <article className="term-card" id={term.id}>
                  <div className="term-card__head">
                    <span className="term-card__icon" aria-hidden="true">
                      <BookMarked size={17} />
                    </span>
                    <div>
                      <p className="term-card__category">{term.category}</p>
                      <h3>{term.name}</h3>
                    </div>
                  </div>
                  <p className="term-card__summary">{term.summary}</p>
                  <p className="term-card__description">{term.description}</p>
                  {term.tips?.length > 0 && (
                    <ul className="term-card__tips">
                      {term.tips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  )}
                  <div className="term-card__tags">
                    {term.relatedTags.map((tag) => (
                      <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="mini-tag">
                        {tag}
                      </Link>
                    ))}
                    <Link to={`/terms/${term.id}`} className="term-card__open">
                      Открыть термин <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="category-cta">
        <div className="container category-cta__inner">
          <div>
            <p className="eyebrow">Поиск по базе</p>
            <h2>Не нашли нужный термин?</h2>
            <p>
              Опишите задачу словами: «как выровнять торт кремом», «виды кремов для декора»,
              «торт с ягодами». Поиск разберёт запрос на слова и найдёт материалы по всем разделам.
            </p>
          </div>
          <Link to="/search" className="button button--dark">
            Перейти к поиску <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
