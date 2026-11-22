import entitiesData from '../data/knowledge/entities.json';
import profilesData from '../data/knowledge/profiles.json';
import relationsData from '../data/knowledge/relations.json';
import rulesData from '../data/knowledge/rules.json';
import cakesData from '../data/cakes.json';
import recipesData from '../data/recipes.json';
import articlesData from '../data/articles.json';
import videosData from '../data/videos.json';
import categoriesData from '../data/categories.json';
import taxonomyData from '../data/taxonomy.json';
import { normalize, stem, tokenize } from '../utils/text';
import {
  explainDerivedFact,
  inferFacts,
  PREDICATE_LABELS,
  runQueryInference,
} from './inferenceEngine';

const entities = new Map();
const facts = [];
const factKeys = new Set();

function addEntity(entity) {
  if (!entity?.id || entities.has(entity.id)) return;
  entities.set(entity.id, { aliases: [], tags: [], ...entity });
}

entitiesData.forEach(addEntity);

const profileById = new Map(profilesData.map((profile) => [profile.cakeId, profile]));

function addFact(subject, predicate, object, confidence = 1, extra = {}) {
  const key = `${subject}|${predicate}|${object}`;
  if (factKeys.has(key)) return null;
  const fact = {
    id: `a${facts.length + 1}`,
    subject,
    predicate,
    object,
    confidence,
    source: 'asserted',
    ...extra,
  };
  facts.push(fact);
  factKeys.add(key);
  return fact;
}

// --- Базовые сущности из существующего контента -------------------------

cakesData.forEach((cake) => {
  addEntity({
    id: `cake:${cake.id}`,
    type: 'Cake',
    name: cake.name,
    summary: cake.description,
    aliases: [cake.name, ...cake.tags],
    tags: cake.tags,
    url: `/cakes/${cake.slug}`,
    image: cake.image,
  });
  addFact(`cake:${cake.id}`, 'hasCategory', `category:${cake.categories[0]}`, 1, { source: 'cake-data' });
});

categoriesData.forEach((category) => {
  addEntity({
    id: `category:${category.id}`,
    type: 'Category',
    name: category.name,
    summary: category.description,
    aliases: [category.name, ...(category.keywords || [])],
    tags: category.keywords || [],
    url: `/cakes?category=${category.id}`,
    image: category.image,
  });
});

taxonomyData.forEach((term) => {
  addEntity({
    id: `term:${term.id}`,
    type: 'Term',
    name: term.name,
    summary: term.summary,
    aliases: [term.name, ...(term.relatedTags || [])],
    tags: term.relatedTags || [],
    url: `/terms/${term.id}`,
  });
});

articlesData.forEach((article) => {
  addEntity({
    id: `article:${article.id}`,
    type: 'Article',
    name: article.title,
    summary: article.description,
    aliases: [article.title, ...article.tags],
    tags: article.tags,
    url: `/articles/${article.slug}`,
    image: article.image,
  });
});

recipesData.forEach((recipe) => {
  addEntity({
    id: `recipe:${recipe.id}`,
    type: 'Recipe',
    name: recipe.title,
    summary: recipe.description,
    aliases: [recipe.title, ...recipe.tags],
    tags: recipe.tags,
    url: `/recipes/${recipe.id}`,
    image: recipe.image,
  });
  addFact(`recipe:${recipe.id}`, 'hasCake', `cake:${recipe.cakeId}`);
  addFact(`cake:${recipe.cakeId}`, 'hasRecipe', `recipe:${recipe.id}`);
});

videosData.forEach((video) => {
  addEntity({
    id: `video:${video.id}`,
    type: 'Video',
    name: video.title,
    summary: video.description,
    aliases: [video.title, ...video.tags],
    tags: video.tags,
    url: video.url,
    image: video.thumbnail,
  });
});

// --- Ингредиенты ---------------------------------------------------------

const ingredientIdByName = new Map();
function ingredientEntity(name) {
  const normalized = normalize(name);
  if (!normalized) return null;
  if (ingredientIdByName.has(normalized)) return ingredientIdByName.get(normalized);
  const id = `ingredient:${normalized.replace(/[^a-zа-яё0-9]+/g, '-')}`;
  addEntity({
    id,
    type: 'Ingredient',
    name: name.trim(),
    summary: `Ингредиент кондитерской базы знаний: ${name.trim()}.`,
    aliases: [name.trim()],
    tags: ['ингредиент'],
  });
  ingredientIdByName.set(normalized, id);
  return id;
}

// --- Профили тортов -> факты -------------------------------------------

for (const profile of profilesData) {
  const cake = cakesData.find((item) => item.id === profile.cakeId);
  if (!cake) continue;
  const cakeId = `cake:${cake.id}`;
  profile.bases.forEach((base) => addFact(cakeId, 'hasBase', base, 1, { source: 'cake-profile' }));
  profile.creams.forEach((cream) => addFact(cakeId, 'hasCream', cream, 1, { source: 'cake-profile' }));
  profile.fillings.forEach((filling) => addFact(cakeId, 'hasFilling', filling, 1, { source: 'cake-profile' }));
  profile.flavors.forEach((flavor) => addFact(cakeId, 'hasFlavor', flavor, 1, { source: 'cake-profile' }));
  profile.textures.forEach((texture) => addFact(cakeId, 'hasTexture', texture, 1, { source: 'cake-profile' }));
  profile.techniques.forEach((technique) => addFact(cakeId, 'usesTechnique', technique, 1, { source: 'cake-profile' }));
  const processMap = {
    'technique:baking': 'process:baking',
    'technique:cooling': 'process:cooling',
    'technique:assembly': 'process:assembly',
    'technique:leveling': 'process:leveling',
    'technique:glazing': 'process:glazing',
    'technique:whipping': 'process:mixing',
  };
  profile.techniques.forEach((technique) => {
    if (processMap[technique]) addFact(cakeId, 'hasStep', processMap[technique], 0.9, { source: 'cake-profile' });
  });
  profile.decorations.forEach((decor) => addFact(cakeId, 'hasDecoration', decor, 1, { source: 'cake-profile' }));
  addFact(cakeId, 'hasLayerCount', profile.layerCount, 1, { source: 'cake-profile' });
  addFact(cakeId, 'hasDecorationComplexity', profile.decorationComplexity, 1, { source: 'cake-profile' });
  addFact(
    cakeId,
    'hasPreparationMode',
    cake.type === 'Без выпечки' ? 'mode:no-bake' : 'mode:baked',
    1,
    { source: 'cake-data' },
  );
  cake.ingredients.forEach((name) => {
    const id = ingredientEntity(name);
    if (id) addFact(cakeId, 'containsIngredient', id);
  });
}

// --- Типы всех сущностей ------------------------------------------------

for (const entity of entities.values()) {
  addFact(entity.id, 'hasType', `type:${entity.type}`, 1, { source: 'ontology' });
}

// --- Связи из relations.json -------------------------------------------

relationsData.forEach((relation) => {
  addFact(relation.subject, relation.predicate, relation.object, relation.confidence ?? 1, {
    source: relation.source || 'domain',
    note: relation.note,
  });
});

// --- Автоматические связи по совпадению сущностей ----------------------

const aliasIndex = [];
function indexAliases() {
  for (const entity of entities.values()) {
    const names = new Set([entity.name, ...(entity.aliases || [])]);
    for (const name of names) {
      const normalized = normalize(name);
      const tokens = tokenize(name, { stemTokens: true });
      if (!normalized || !tokens.length) continue;
      aliasIndex.push({ entityId: entity.id, normalized, tokens, length: normalized.length });
    }
  }
}
indexAliases();

function findEntitiesInText(text, { limit = 12, types = null } = {}) {
  const normalized = normalize(text);
  const tokens = new Set(tokenize(text, { stemTokens: true }));
  const matches = [];
  for (const alias of aliasIndex) {
    const entity = entities.get(alias.entityId);
    if (!entity) continue;
    if (types && !types.includes(entity.type)) continue;
    let matched = false;
    const tokenMatches = (queryToken, aliasToken) =>
      queryToken === aliasToken ||
      (aliasToken.length >= 4 && queryToken.startsWith(aliasToken)) ||
      (queryToken.length >= 4 && aliasToken.startsWith(queryToken));
    if (alias.tokens.length === 1) {
      matched = [...tokens].some((token) => tokenMatches(token, alias.tokens[0]));
    } else if (normalized.includes(alias.normalized)) {
      matched = true;
    } else {
      matched = alias.tokens.every((aliasToken) => [...tokens].some((token) => tokenMatches(token, aliasToken)));
    }
    if (matched) matches.push({ entityId: alias.entityId, length: alias.length });
  }
  const unique = new Map();
  for (const match of matches) {
    const previous = unique.get(match.entityId);
    if (!previous || match.length > previous) unique.set(match.entityId, match.length);
  }
  return [...unique.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

// термины и статьи -> ближайшие сущности по тегам/названиям
taxonomyData.forEach((term) => {
  const related = findEntitiesInText(
    [term.name, term.summary, term.description, ...(term.relatedTags || [])].join(' '),
    { limit: 8, types: ['Cream', 'Base', 'Filling', 'Technique', 'Ingredient', 'Texture', 'Flavor'] },
  );
  related.forEach((entityId) => addFact(`term:${term.id}`, 'relatedTo', entityId, 0.9, { source: 'term-match' }));
});
articlesData.forEach((article) => {
  const related = findEntitiesInText(
    [article.title, article.description, ...(article.tags || []), ...(article.relatedCakes || [])].join(' '),
    { limit: 7, types: ['Cream', 'Base', 'Filling', 'Technique', 'Flavor', 'Problem'] },
  );
  related.forEach((entityId) => addFact(`article:${article.id}`, 'relatedTo', entityId, 0.8, { source: 'article-match' }));
});
cakesData.forEach((cake) => {
  const related = findEntitiesInText(
    [cake.name, cake.description, ...(cake.tags || []), ...(cake.ingredients || [])].join(' '),
    { limit: 8, types: ['Cream', 'Base', 'Filling', 'Technique', 'Flavor', 'Texture'] },
  );
  related.forEach((entityId) => addFact(`cake:${cake.id}`, 'relatedTo', entityId, 0.8, { source: 'cake-match' }));
});

// --- Вывод по доменным правилам ---------------------------------------

const rules = rulesData.map((rule) => ({
  ...rule,
  conditions: rule.conditions || rule.if || [],
  conclusions: rule.conclusions || rule.then || [],
}));
const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
const domainRules = rules.filter((rule) => rule.mode === 'domain');
const queryRules = rules.filter((rule) => rule.mode === 'query');
const closure = inferFacts(facts, domainRules, { maxIterations: 10 });
const allFacts = closure.facts;
const allFactsById = new Map(allFacts.map((fact) => [fact.id, fact]));
const derivedFacts = closure.derived;

const outgoing = new Map();
const incoming = new Map();
for (const fact of allFacts) {
  if (!outgoing.has(fact.subject)) outgoing.set(fact.subject, []);
  if (!incoming.has(fact.object)) incoming.set(fact.object, []);
  outgoing.get(fact.subject).push(fact);
  incoming.get(fact.object).push(fact);
}

// --- Публичный API ------------------------------------------------------

export function getEntity(id) {
  return entities.get(id) || null;
}

export function getAllEntities() {
  return [...entities.values()];
}

export function getEntitiesByType(type) {
  return [...entities.values()].filter((entity) => entity.type === type);
}

export function getFactRelations(id) {
  return {
    outgoing: (outgoing.get(id) || []).map((fact) => ({ fact, target: entities.get(fact.object) || null })),
    incoming: (incoming.get(id) || []).map((fact) => ({ fact, source: entities.get(fact.subject) || null })),
  };
}

export function getRelatedEntityIds(id, limit = 20) {
  const ids = new Set();
  for (const fact of outgoing.get(id) || []) {
    if (['hasBase', 'hasCream', 'hasFilling', 'usesTechnique', 'hasDecoration', 'hasFlavor', 'hasTexture', 'relatedTo', 'compatibleWith', 'suitableFor', 'hasAlternative', 'solvedBy', 'hasCause'].includes(fact.predicate)) {
      ids.add(fact.object);
    }
  }
  for (const fact of incoming.get(id) || []) {
    if (['hasBase', 'hasCream', 'hasFilling', 'usesTechnique', 'hasDecoration', 'hasFlavor', 'hasTexture', 'relatedTo', 'compatibleWith', 'suitableFor', 'hasAlternative'].includes(fact.predicate)) {
      ids.add(fact.subject);
    }
  }
  return [...ids].filter((entityId) => entityId !== id).slice(0, limit);
}

export function getRelatedDocuments(entityId, limit = 8, maxDepth = 2) {
  const docs = [];
  const visited = new Set([entityId]);
  let frontier = [entityId];

  for (let depth = 0; depth < maxDepth; depth += 1) {
    const next = [];
    for (const id of frontier) {
      for (const fact of [...(outgoing.get(id) || []), ...(incoming.get(id) || [])]) {
        if (!['relatedTo', 'relatedArticle', 'hasCream', 'hasBase', 'hasFilling', 'hasFlavor', 'hasTexture', 'hasRecipe', 'isA'].includes(fact.predicate)) continue;
        const other = fact.subject === id ? fact.object : fact.subject;
        if (!other || visited.has(other)) continue;
        visited.add(other);
        next.push(other);
        const entity = entities.get(other);
        if (entity?.url) {
          docs.push({
            id: other,
            type: entity.type,
            name: entity.name,
            summary: entity.summary,
            url: entity.url,
            image: entity.image,
            depth: depth + 1,
          });
        }
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }

  const typeOrder = { Article: 0, Recipe: 1, Term: 2, Cake: 3, Video: 4, Category: 5 };
  return docs
    .filter((doc, index, list) => list.findIndex((item) => item.id === doc.id) === index)
    .sort((a, b) => a.depth - b.depth || (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9))
    .slice(0, limit)
    .map(({ depth, ...doc }) => doc);
}


export function getIncomingFacts(objectId, predicate = null) {
  return (incoming.get(objectId) || []).filter((fact) => !predicate || fact.predicate === predicate);
}

export function getRecommendationsForCake(cakeId) {
  const entityId = `cake:${cakeId}`;
  const flavors = getFactsFor(entityId, 'hasFlavor').map((fact) => fact.object);
  const creams = new Map();
  const fillings = new Map();
  const reasons = [];
  for (const flavorId of flavors) {
    const flavor = entities.get(flavorId);
    for (const fact of getIncomingFacts(flavorId, 'compatibleWith')) {
      const entity = entities.get(fact.subject);
      if (!entity) continue;
      const reason = `«${entity.name}» сочетается с вкусом «${flavor?.name || flavorId}»`;
      if (entity.type === 'Cream') {
        const entry = creams.get(entity.id) || { entity, reasons: [] };
        entry.reasons.push(reason);
        creams.set(entity.id, entry);
      }
      if (entity.type === 'Filling') {
        const entry = fillings.get(entity.id) || { entity, reasons: [] };
        entry.reasons.push(reason);
        fillings.set(entity.id, entry);
      }
      reasons.push(reason);
    }
  }
  return {
    flavors: flavors.map((id) => entities.get(id)).filter(Boolean),
    creams: [...creams.values()],
    fillings: [...fillings.values()],
    reasons,
  };
}

export function getRules() {
  return rules;
}

export function getRule(id) {
  return rulesById.get(id) || null;
}

export function getDerivedFacts() {
  return derivedFacts;
}

export function getFactsFor(subject, predicate = null) {
  return (outgoing.get(subject) || []).filter((fact) => !predicate || fact.predicate === predicate);
}

export function getKBStats() {
  const byType = {};
  for (const entity of entities.values()) {
    byType[entity.type] = (byType[entity.type] || 0) + 1;
  }
  return {
    entities: entities.size,
    facts: allFacts.length,
    assertedFacts: facts.length,
    derivedFacts: derivedFacts.length,
    rules: rules.length,
    domainRules: domainRules.length,
    queryRules: queryRules.length,
    byType,
  };
}

export function reasonAboutQuery(analysis, queryFacts) {
  const result = runQueryInference(queryFacts, allFacts, queryRules);
  const queryDerived = result.derived.filter((fact) => fact.subject === 'query');
  const combined = [...allFacts, ...queryFacts, ...result.derived];
  const combinedById = new Map(combined.map((fact) => [fact.id, fact]));
  const conclusions = queryDerived.map((fact) => ({
    fact,
    explanation: explainDerivedFact(fact, combinedById, rulesById, entities),
    object: entities.get(fact.object) || null,
  }));
  const recommendations = conclusions.filter((item) => item.fact.predicate === 'recommendation');
  const causes = conclusions.filter((item) => item.fact.predicate === 'possibleCause');
  const boost = new Map();
  const addBoost = (docId, amount, reason) => {
    const current = boost.get(docId) || { amount: 0, reasons: [] };
    current.amount = Math.max(current.amount, amount);
    if (reason && !current.reasons.includes(reason)) current.reasons.push(reason);
    boost.set(docId, current);
  };

  for (const item of [...recommendations, ...causes]) {
    if (!item.object) continue;
    const focusMismatch =
      (analysis.focus === 'Cream' && item.object.type === 'Filling') ||
      (analysis.focus === 'Filling' && item.object.type === 'Cream') ||
      (analysis.focus === 'Base' && !['Base', 'Cake'].includes(item.object.type));
    const amount = item.fact.predicate === 'recommendation' ? (focusMismatch ? 10 : 45) : 30;
    const docs = getRelatedDocuments(item.fact.object, 5, 1);
    for (const doc of docs) {
      const docId = entityIdToDocId(doc.id);
      if (docId) addBoost(docId, amount, item.explanation?.ruleName);
    }
  }

  for (const entityId of analysis.entityIds) {
    const entity = entities.get(entityId);
    if (!entity) continue;
    if (entity.url) {
      const docId = entityIdToDocId(entityId);
      if (docId) addBoost(docId, 28, 'сущность запроса');
    }
    for (const doc of getRelatedDocuments(entityId, 4)) {
      const docId = entityIdToDocId(doc.id);
      if (docId) addBoost(docId, 12, `связано с «${entity.name}»`);
    }
  }

  return {
    analysis,
    conclusions,
    recommendations,
    causes,
    boost,
    derived: result.derived,
    reasoning: {
      analysis,
      conclusions,
      recommendations,
      causes,
    },
  };
}

export function entityIdToDocId(entityId) {
  const [type, id] = entityId.split(':');
  if (!id) return null;
  if (type === 'cake') return `cake-${id}`;
  if (type === 'article') return `article-${id}`;
  if (type === 'recipe') return `recipe-${id}`;
  if (type === 'video') return `video-${id}`;
  if (type === 'term') return `term-${id}`;
  if (type === 'category') return `category-${id}`;
  return null;
}

export function findEntitiesInQuery(text, options) {
  return findEntitiesInText(text, options);
}

export function entityLabel(id) {
  return entities.get(id)?.name || id;
}

export { PREDICATE_LABELS };
