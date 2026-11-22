import cakesData from '../data/cakes.json';
import recipesData from '../data/recipes.json';
import articlesData from '../data/articles.json';
import videosData from '../data/videos.json';
import categoriesData from '../data/categories.json';
import taxonomyData from '../data/taxonomy.json';
import { sortByDateDesc } from './collections';

export const categories = categoriesData.map((category) => ({
  ...category,
  url: `/cakes?category=${category.id}`,
}));

const categoryById = new Map(categories.map((category) => [category.id, category]));

export const cakes = cakesData.map((cake) => ({
  ...cake,
  url: `/cakes/${cake.slug}`,
  categoriesInfo: cake.categories.map((id) => categoryById.get(id)).filter(Boolean),
  categoryNames: cake.categories.map((id) => categoryById.get(id)?.name || id),
  recipe: null,
}));

export const recipes = recipesData.map((recipe) => ({
  ...recipe,
  url: `/recipes/${recipe.id}`,
  cake: cakes.find((cake) => cake.id === recipe.cakeId) || null,
}));

// Связь «торт → рецепт» заполняется после построения обогащённых рецептов.
const enrichedRecipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
cakes.forEach((cake) => {
  cake.recipe = cake.recipeId ? enrichedRecipeById.get(cake.recipeId) || null : null;
});

export const articles = sortByDateDesc(
  articlesData.map((article) => ({
    ...article,
    url: `/articles/${article.slug}`,
  })),
);

export const videos = videosData.map((video) => ({
  ...video,
  url: `/videos#${video.id}`,
}));

export const terms = taxonomyData.map((term) => ({
  ...term,
  url: `/terms/${term.id}`,
}));

export const cakeTypes = [...new Set(cakes.map((cake) => cake.type))].sort((a, b) => a.localeCompare(b, 'ru'));
export const difficulties = ['Лёгкий', 'Средний', 'Сложный'];
export const articleCategories = [...new Set(articles.map((article) => article.category))].sort((a, b) => a.localeCompare(b, 'ru'));
export const videoCategories = [...new Set(videos.map((video) => video.category))].sort((a, b) => a.localeCompare(b, 'ru'));
export const termCategories = ['Кремы', 'Ингредиенты', 'Техники'];

export const popularCakes = [...cakes].sort((a, b) => b.popularity - a.popularity);
export const latestArticles = articles.slice(0, 3);
export const featuredRecipes = recipes.slice(0, 3);
export const featuredVideos = videos.slice(0, 3);

export function getCategory(id) {
  return categoryById.get(id) || null;
}

export function getCakeBySlug(slug) {
  return cakes.find((cake) => cake.slug === slug) || null;
}

export function getCakeById(id) {
  return cakes.find((cake) => cake.id === id) || null;
}

export function getArticleBySlug(slug) {
  return articles.find((article) => article.slug === slug) || null;
}

export function getArticleById(id) {
  return articles.find((article) => article.id === id) || null;
}

export function getRecipeById(id) {
  return recipes.find((recipe) => recipe.id === id) || null;
}

export function getTermById(id) {
  return terms.find((term) => term.id === id) || null;
}

export function getCakesByCategory(categoryId) {
  return cakes.filter((cake) => cake.categories.includes(categoryId));
}

export function getCakesByTag(tag) {
  const normalized = tag.toLowerCase();
  return cakes.filter((cake) => cake.tags.some((item) => item.toLowerCase() === normalized));
}

export function getRelatedCakes(cake, limit = 3) {
  if (!cake) return [];
  const scored = cakes
    .filter((candidate) => candidate.id !== cake.id)
    .map((candidate) => {
      const sharedCategories = candidate.categories.filter((id) => cake.categories.includes(id)).length;
      const sharedTags = candidate.tags.filter((tag) => cake.tags.includes(tag)).length;
      return { cake: candidate, score: sharedCategories * 3 + sharedTags };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.cake.popularity - a.cake.popularity);
  return scored.slice(0, limit).map((entry) => entry.cake);
}

export function getRelatedArticlesForCake(cake, limit = 3) {
  if (!cake) return [];
  const explicit = (cake.relatedArticles || []).map(getArticleById).filter(Boolean);
  const rest = articles
    .filter((article) => !explicit.some((item) => item.id === article.id))
    .map((article) => {
      const sharedTags = article.tags.filter((tag) => cake.tags.includes(tag)).length;
      return { article, score: sharedTags };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return [...explicit, ...rest.map((entry) => entry.article)].slice(0, limit);
}

export function getRelatedCakesForArticle(article, limit = 3) {
  if (!article) return [];
  const explicit = (article.relatedCakes || []).map(getCakeById).filter(Boolean);
  const rest = cakes
    .filter((cake) => !explicit.some((item) => item.id === cake.id))
    .map((cake) => {
      const sharedTags = cake.tags.filter((tag) => article.tags.includes(tag)).length;
      return { cake, score: sharedTags };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return [...explicit, ...rest.map((entry) => entry.cake)].slice(0, limit);
}

export function getRelatedRecipes(recipe, limit = 3) {
  if (!recipe) return [];
  return recipes
    .filter((candidate) => candidate.id !== recipe.id)
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) => recipe.tags.includes(tag)).length;
      const sameCake = candidate.cakeId === recipe.cakeId ? 2 : 0;
      return { recipe: candidate, score: sharedTags + sameCake };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.recipe);
}

export function getCategoryStats() {
  return categories.map((category) => ({
    ...category,
    count: cakes.filter((cake) => cake.categories.includes(category.id)).length,
  }));
}

export function getTermGroups() {
  return termCategories.map((category) => ({
    category,
    items: terms.filter((term) => term.category === category),
  }));
}

export const knowledgeStats = {
  cakes: cakes.length,
  articles: articles.length,
  recipes: recipes.length,
  videos: videos.length,
  categories: categories.length,
  terms: terms.length,
};
