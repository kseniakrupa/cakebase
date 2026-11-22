import { Link } from 'react-router-dom';
import { ArrowRight, ListChecks } from 'lucide-react';
import SmartImage from '../common/SmartImage';
import MetaRow from '../common/MetaRow';

export default function RecipeCard({ recipe, variant = 'default' }) {
  return (
    <article className={`recipe-card recipe-card--${variant}`}>
      <Link to={recipe.url} className="recipe-card__media" aria-label={recipe.title}>
        <SmartImage src={recipe.image} alt="" />
        <span className="recipe-card__label">Рецепт</span>
      </Link>
      <div className="recipe-card__body">
        {recipe.cake && (
          <p className="recipe-card__cake">
            к торту «{recipe.cake.name}»
          </p>
        )}
        <h3 className="recipe-card__title">
          <Link to={recipe.url}>{recipe.title}</Link>
        </h3>
        <p className="recipe-card__description">{recipe.description}</p>
        <MetaRow compact time={recipe.preparationTime} difficulty={recipe.difficulty} servings={recipe.servings} />
        <div className="recipe-card__footer">
          <span className="recipe-card__ingredients">
            <ListChecks size={14} aria-hidden="true" />
            {recipe.ingredients.length} ингредиентов
          </span>
          <Link to={recipe.url} className="text-link">
            Готовить <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
