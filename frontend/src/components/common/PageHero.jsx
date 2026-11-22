export default function PageHero({ eyebrow, title, accent, description, children, aside, tone = 'default' }) {
  return (
    <section className={`page-hero page-hero--${tone}`}>
      <div className="container page-hero__inner">
        <div className="page-hero__text">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="page-hero__title">
            {title}
            {accent && <em> {accent}</em>}
          </h1>
          {description && <p className="page-hero__description">{description}</p>}
          {children}
        </div>
        {aside && <div className="page-hero__aside">{aside}</div>}
      </div>
    </section>
  );
}
