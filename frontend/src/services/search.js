import Fuse from 'fuse.js';
import { cakes, articles, recipes, videos, terms, categories } from './knowledge';
import { STOP_WORDS, layoutVariant, levenshtein, normalize, stem, tokenize, uniqueTokens } from '../utils/text';
import { analyzeQuery } from './queryAnalyzer';
import { getAllEntities, reasonAboutQuery } from './knowledgeBase';

const TYPE_LABELS = {
  cake: 'Торт',
  article: 'Статья',
  recipe: 'Рецепт',
  video: 'Видео',
  term: 'Справочник',
  category: 'Категория',
  news: 'Новость',
};

const DOMAIN_WORDS = [
  'торт', 'торты', 'рецепт', 'крем', 'кремы', 'бисквит', 'бисквитный', 'шоколадный',
  'шоколад', 'какао', 'медовик', 'медовый', 'наполеон', 'тирамису', 'чизкейк', 'мусс',
  'муссовый', 'песочный', 'слоёный', 'фруктовый', 'ягодный', 'малина', 'клубника', 'вишня',
  'лимон', 'лимонный', 'фисташка', 'фисташковый', 'карамель', 'карамельный', 'ваниль',
  'ванильный', 'сливочный', 'творожный', 'заварной', 'масляный', 'сметанный', 'сметана',
  'ганаш', 'глазурь', 'пропитка', 'корж', 'коржи', 'начинка', 'декор', 'украшение',
  'выравнивание', 'выровнять', 'темперирование', 'температура', 'техника', 'ингредиенты',
  'желатин', 'агар', 'меренга', 'безе', 'суфле', 'павлова', 'захер', 'добош', 'опера',
  'фрезье', 'брауни', 'морковный', 'ореховый', 'сливки', 'маскарпоне', 'красный', 'бархат',
  'чёрный', 'лес', 'молочный', 'девочка', 'прага', 'киевский', 'трюфельный', 'три',
  'шоколада', 'без', 'выпечки', 'новости', 'статьи', 'видео', 'категории', 'кондитерский',
  'кондитерская', 'выпечка', 'духовка', 'разрыхлитель', 'эспрессо', 'кофе', 'кофейный',
  'мёд', 'мед', 'сливки', 'сыр', 'сгущёнка', 'сгущённое', 'молоко', 'пюре', 'конфи',
  'ганаш', 'трюфель', 'помадка', 'капкейк', 'эклер', 'печенье', 'пахта', 'крахмал',
];

const vocabularyWords = new Set();
const vocabularyStems = new Set();

function registerWord(word) {
  const normalized = normalize(word);
  if (normalized.length < 2) return;
  vocabularyWords.add(normalized);
  vocabularyStems.add(stem(normalized));
}

DOMAIN_WORDS.forEach(registerWord);

function buildDocFields(doc) {
  return {
    ...doc,
    typeLabel: TYPE_LABELS[doc.type] || '',
    titleNorm: normalize(doc.title),
    tagNorm: normalize((doc.tags || []).join(' ')),
    categoryNorm: normalize(doc.category || ''),
    descriptionNorm: normalize(doc.description || ''),
    bodyNorm: normalize(doc.body || ''),
    titleTokens: uniqueTokens(doc.title),
    tagTokens: uniqueTokens((doc.tags || []).join(' ')),
    ingredientTokens: uniqueTokens((doc.ingredients || []).join(' ')),
    categoryTokens: uniqueTokens(doc.category || ''),
    descriptionTokens: uniqueTokens(doc.description || ''),
    bodyTokens: uniqueTokens(doc.body || ''),
  };
}

function cakeDoc(cake) {
  return buildDocFields({
    id: `cake-${cake.id}`,
    type: 'cake',
    kbId: `cake:${cake.id}`,
    title: cake.name,
    description: cake.description,
    subtitle: cake.categoryNames.join(' · '),
    category: [...cake.categoryNames, cake.type].join(' '),
    tags: cake.tags,
    ingredients: cake.ingredients,
    body: [cake.longDescription, cake.origin, ...(cake.tips || [])].join(' '),
    image: cake.image,
    url: cake.url,
    meta: {
      difficulty: cake.difficulty,
      preparationTime: cake.preparationTime,
      servings: cake.servings,
      categories: cake.categories,
      cakeType: cake.type,
    },
  });
}

function articleDoc(article) {
  const contentText = (article.content || [])
    .map((block) => (block.items ? block.items.join(' ') : block.text))
    .join(' ');
  return buildDocFields({
    id: `article-${article.id}`,
    type: 'article',
    kbId: `article:${article.id}`,
    title: article.title,
    description: article.description,
    subtitle: article.category,
    category: article.category,
    tags: article.tags,
    ingredients: [],
    body: contentText,
    image: article.image,
    url: article.url,
    date: article.publicationDate,
    meta: {
      readingTime: article.readingTime,
      publicationDate: article.publicationDate,
    },
  });
}

function recipeDoc(recipe) {
  return buildDocFields({
    id: `recipe-${recipe.id}`,
    type: 'recipe',
    kbId: `recipe:${recipe.id}`,
    title: recipe.title,
    description: recipe.description,
    subtitle: recipe.cake ? `Рецепт к торту «${recipe.cake.name}»` : 'Рецепт',
    category: recipe.cake ? recipe.cake.categoryNames.join(' ') : '',
    tags: recipe.tags,
    ingredients: recipe.ingredients.map((item) => item.name),
    body: recipe.steps.join(' '),
    image: recipe.image,
    url: recipe.url,
    meta: {
      difficulty: recipe.difficulty,
      preparationTime: recipe.preparationTime,
      servings: recipe.servings,
      cakeId: recipe.cakeId,
      categories: recipe.cake?.categories || [],
      cakeType: recipe.cake?.type || '',
    },
  });
}

function videoDoc(video) {
  return buildDocFields({
    id: `video-${video.id}`,
    type: 'video',
    kbId: `video:${video.id}`,
    title: video.title,
    description: video.description,
    subtitle: video.channel,
    category: video.category,
    tags: video.tags,
    ingredients: [],
    body: `${video.description} ${video.channel}`,
    image: video.thumbnail,
    url: video.url,
    meta: {
      duration: video.duration,
      channel: video.channel,
      isDemo: video.isDemo,
      external: true,
    },
  });
}

function termDoc(term) {
  return buildDocFields({
    id: `term-${term.id}`,
    type: 'term',
    kbId: `term:${term.id}`,
    title: term.name,
    description: term.summary,
    subtitle: term.category,
    category: term.category,
    tags: term.relatedTags,
    ingredients: [],
    body: [term.description, ...(term.tips || [])].join(' '),
    image: null,
    url: term.url,
    meta: { category: term.category },
  });
}

export function buildNewsDocs(items = []) {
  return items.map((item) =>
    buildDocFields({
      id: `news-${item.id}`,
      type: 'news',
      title: item.title,
      description: item.description,
      subtitle: item.source,
      category: item.source,
      tags: [],
      ingredients: [],
      body: item.description,
      image: item.image,
      url: item.link,
      date: item.date,
      meta: { source: item.source, external: true, publicationDate: item.date },
    }),
  );
}

export const searchDocs = [
  ...cakes.map(cakeDoc),
  ...articles.map(articleDoc),
  ...recipes.map(recipeDoc),
  ...videos.map(videoDoc),
  ...terms.map(termDoc),
  ...categories.map((category) =>
    buildDocFields({
      id: `category-${category.id}`,
      type: 'category',
      kbId: `category:${category.id}`,
      title: category.name,
      description: category.description,
      subtitle: 'Категория тортов',
      category: category.name,
      tags: category.keywords,
      ingredients: [],
      body: category.description,
      image: category.image,
      url: category.url,
      meta: { category: category.name },
    }),
  ),
];

// Словарь автокоррекции собирается из всех текстовых полей базы знаний,
// поэтому существующие словоформы не считаются опечатками.
for (const doc of searchDocs) {
  const corpus = [
    doc.title,
    (doc.tags || []).join(' '),
    (doc.ingredients || []).join(' '),
    doc.category,
    doc.description,
    doc.body,
  ].join(' ');
  tokenize(corpus, { keepStopWords: true }).forEach(registerWord);
}

const FUSE_KEYS = [
  { name: 'title', weight: 0.55 },
  { name: 'tags', weight: 0.18 },
  { name: 'ingredients', weight: 0.1 },
  { name: 'description', weight: 0.12 },
  { name: 'body', weight: 0.05 },
];

const fuse = new Fuse(searchDocs, {
  includeScore: true,
  includeMatches: true,
  threshold: 0.42,
  ignoreLocation: true,
  minMatchCharLength: 3,
  keys: FUSE_KEYS,
});

const newsFuseCache = new WeakMap();

function getNewsFuse(newsDocs) {
  if (!newsDocs || !newsDocs.length) return null;
  if (!newsFuseCache.has(newsDocs)) {
    newsFuseCache.set(
      newsDocs,
      new Fuse(newsDocs, {
        includeScore: true,
        threshold: 0.38,
        ignoreLocation: true,
        minMatchCharLength: 3,
        keys: FUSE_KEYS,
      }),
    );
  }
  return newsFuseCache.get(newsDocs);
}

/* --- Автокоррекция ------------------------------------------------------- */

const correctionCache = new Map();

function findClosestWord(word) {
  let best = null;
  let bestDistance = Infinity;
  const maxDistance = word.length <= 5 ? 1 : Math.min(3, Math.floor(word.length / 3));
  for (const candidate of vocabularyWords) {
    if (Math.abs(candidate.length - word.length) > maxDistance) continue;
    const distance = levenshtein(word, candidate);
    if (distance === 0) return null;
    if (distance > 1 && candidate[0] !== word[0]) continue;
    if (distance <= maxDistance && distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

export function correctQuery(query) {
  const normalized = normalize(query);
  if (!normalized) return { corrected: '', changed: false, changes: [] };
  if (correctionCache.has(normalized)) return correctionCache.get(normalized);
  const words = normalized.split(' ');
  const changes = [];
  const correctedWords = words.map((word) => {
    if (word.length < 4 || STOP_WORDS.has(word)) return word;
    if (vocabularyWords.has(word)) return word;
    // Не «исправляем» корректную падежную форму на именительный падеж.
    if (VALID_WORD_ENDINGS.some((ending) => word.endsWith(ending)) && vocabularyStems.has(stem(word))) return word;
    const closest = findClosestWord(word);
    if (!closest || normalize(closest) === word) return word;
    changes.push({ from: word, to: closest });
    return closest;
  });
  const corrected = correctedWords.join(' ');
  const result = { corrected, changed: corrected !== normalized, changes };
  correctionCache.set(normalized, result);
  return result;
}

const VALID_WORD_ENDINGS = [
  'ыми', 'ими', 'ого', 'его', 'ому', 'ему', 'ами', 'ями', 'ах', 'ях', 'ов', 'ев',
  'ый', 'ий', 'ой', 'ая', 'яя', 'ое', 'ее', 'ые', 'ие', 'ую', 'юю', 'ым', 'им',
  'ых', 'их', 'ом', 'ем', 'ам', 'ям', 'ия', 'ие', 'ью', 'а', 'я', 'ы', 'и', 'е', 'у', 'ю',
];

// Слово «торт» есть почти в каждой карточке и не должно раздувать выдачу
// по составным запросам вроде «торт с масляным кремом».
const GENERIC_QUERY_TOKENS = new Set(['торт']);

/* --- Подсчёт релевантности ---------------------------------------------- */

function tokenScore(token, doc) {
  let score = 0;
  const fields = [];

  if (doc.titleTokens.includes(token)) {
    score += 72;
    fields.push('title');
  } else if (doc.titleTokens.some((candidate) => candidate.length >= 4 && (candidate.startsWith(token) || (token.length >= 4 && token.startsWith(candidate))))) {
    score += 46;
    fields.push('title');
  }

  if (doc.tagTokens.includes(token) || doc.tagTokens.some((candidate) => candidate.length >= 4 && candidate.startsWith(token))) {
    score += 30;
    fields.push('tags');
  }
  if (doc.ingredientTokens.includes(token) || doc.ingredientTokens.some((candidate) => candidate.length >= 4 && candidate.startsWith(token))) {
    score += 24;
    fields.push('ingredients');
  }
  if (doc.categoryTokens.includes(token) || doc.categoryTokens.some((candidate) => candidate.length >= 4 && candidate.startsWith(token))) {
    score += 20;
    fields.push('category');
  }
  if (doc.descriptionTokens.includes(token) || doc.descriptionTokens.some((candidate) => candidate.length >= 4 && candidate.startsWith(token))) {
    score += 14;
    fields.push('description');
  }
  if (doc.bodyTokens.includes(token) || doc.bodyTokens.some((candidate) => candidate.length >= 5 && candidate.startsWith(token))) {
    score += 7;
    fields.push('body');
  }

  return { score: Math.min(score, 95), fields };
}

function phraseScore(queryNorm, doc) {
  let score = 0;
  if (!queryNorm || queryNorm.length < 3) return score;
  if (doc.titleNorm === queryNorm) score += 180;
  else if (doc.titleNorm.startsWith(queryNorm)) score += 70;
  else if (doc.titleNorm.includes(queryNorm)) score += 50;
  if (doc.tagNorm.includes(queryNorm)) score += 34;
  if (doc.categoryNorm.includes(queryNorm)) score += 22;
  if (doc.descriptionNorm.includes(queryNorm)) score += 18;
  if (doc.bodyNorm.includes(queryNorm)) score += 8;
  return score;
}

const TYPE_ORDER = ['cake', 'article', 'recipe', 'video', 'term', 'category', 'news'];

function evaluateQuery(query, { newsDocs = [], limit = 80 } = {}) {
  const queryNorm = normalize(query);
  if (!queryNorm) {
    return {
      query,
      normalized: '',
      correction: { corrected: '', changed: false, changes: [] },
      results: [],
      total: 0,
      usedTokens: [],
    };
  }

  const correction = correctQuery(query);
  const originalTokens = tokenize(query, { stemTokens: true });
  const correctedTokens = correction.changed ? tokenize(correction.corrected, { stemTokens: true }) : [];
  const tokens = [...new Set([...originalTokens, ...correctedTokens])].filter((token) => token.length > 1);
  const effectiveQuery = correction.changed ? correction.corrected : queryNorm;
  const meaningfulTokens = tokens.filter((token) => !GENERIC_QUERY_TOKENS.has(token));
  const scoringTokens = meaningfulTokens.length ? meaningfulTokens : tokens;
  const minMatchedTokens = meaningfulTokens.length
    ? Math.max(1, Math.ceil(meaningfulTokens.length * 0.6))
    : 0;

  if (!tokens.length) {
    return {
      query,
      normalized: queryNorm,
      correction,
      results: [],
      total: 0,
      usedTokens: [],
    };
  }

  const fuseResults = new Map();
  fuse.search(effectiveQuery).forEach((result) => fuseResults.set(result.item.id, result.score));
  if (!correction.changed) {
    fuse.search(queryNorm).forEach((result) => {
      const previous = fuseResults.get(result.item.id);
      if (previous === undefined || result.score < previous) fuseResults.set(result.item.id, result.score);
    });
  }

  const newsFuse = getNewsFuse(newsDocs);
  const newsResults = new Map();
  if (newsFuse) {
    newsFuse.search(effectiveQuery).forEach((result) => newsResults.set(result.item.id, result.score));
  }

  const allDocs = newsDocs.length ? [...searchDocs, ...newsDocs] : searchDocs;
  const results = [];

  for (const doc of allDocs) {
    const matchedFields = new Set();
    let baseScore = 0;
    let matchedTokens = 0;

    for (const token of scoringTokens) {
      const scored = tokenScore(token, doc);
      if (scored.score > 0) {
        matchedTokens += 1;
        baseScore += scored.score;
        scored.fields.forEach((field) => matchedFields.add(field));
      }
    }

    if (!matchedTokens) {
      const fuzzyScore = doc.type === 'news' ? newsResults.get(doc.id) : fuseResults.get(doc.id);
      if (fuzzyScore === undefined || fuzzyScore > 0.46) continue;
      const fuzzyOnly = (0.46 - fuzzyScore) * 40;
      const phrase = phraseScore(effectiveQuery, doc) * 0.35;
      results.push({
        doc,
        score: fuzzyOnly + phrase,
        matchedFields: ['fuzzy'],
        fuzzy: true,
        coverage: 0,
      });
      continue;
    }

    if (matchedTokens < minMatchedTokens) continue;

    const coverage = matchedTokens / scoringTokens.length;
    const phrase = phraseScore(effectiveQuery, doc);
    const coverageBonus = coverage * 45;
    let exactTokenBonus = 0;
    if (scoringTokens.length === 1 && doc.titleTokens.includes(scoringTokens[0])) {
      exactTokenBonus = 26;
      if (doc.titleTokens.length === 1) exactTokenBonus += 60;
      else if (doc.titleTokens[0] === scoringTokens[0]) exactTokenBonus += 14;
    }
    const fuzzyScore = doc.type === 'news' ? newsResults.get(doc.id) : fuseResults.get(doc.id);
    const fuzzyBonus = fuzzyScore !== undefined ? Math.max(0, 0.4 - fuzzyScore) * 22 : 0;

    results.push({
      doc,
      score: baseScore + phrase + coverageBonus + exactTokenBonus + fuzzyBonus,
      matchedFields: [...matchedFields],
      fuzzy: false,
      coverage,
    });
  }

  results.sort((a, b) => b.score - a.score || TYPE_ORDER.indexOf(a.doc.type) - TYPE_ORDER.indexOf(b.doc.type));

  return {
    query,
    normalized: queryNorm,
    correction,
    results: results.slice(0, limit),
    allResults: results,
    total: results.length,
    usedTokens: scoringTokens,
  };
}

function applyKnowledgeBoost(results, reasoning) {
  if (!reasoning?.boost?.size) return results;
  return results
    .map((result) => {
      const extra = reasoning.boost.get(result.doc.id);
      if (!extra) return result;
      return {
        ...result,
        score: result.score + extra.amount,
        knowledgeReasons: extra.reasons,
      };
    })
    .sort((a, b) => b.score - a.score || TYPE_ORDER.indexOf(a.doc.type) - TYPE_ORDER.indexOf(b.doc.type));
}

export function searchKnowledge(query, options = {}) {
  const normalized = normalize(query);
  if (!normalized) {
    return {
      query,
      normalized: '',
      correction: { corrected: '', changed: false, changes: [], layoutApplied: false },
      results: [],
      total: 0,
      usedTokens: [],
    };
  }

  const primary = evaluateQuery(query, options);
  const variant = layoutVariant(query);
  let chosen = primary;
  let appliedLayout = null;

  if (variant && variant.text !== normalized) {
    const secondary = evaluateQuery(variant.text, options);
    const primaryTop = primary.allResults?.[0]?.score || 0;
    const secondaryTop = secondary.allResults?.[0]?.score || 0;
    if (secondaryTop > primaryTop + 4 && secondary.allResults?.length) {
      chosen = secondary;
      appliedLayout = variant;
    }
  }

  const correction = appliedLayout
    ? {
        ...chosen.correction,
        corrected: chosen.correction.changed ? chosen.correction.corrected : appliedLayout.text,
        changed: true,
        layoutApplied: true,
      }
    : { ...chosen.correction, layoutApplied: false };

  const analysisQuery = chosen.correction.changed
    ? chosen.correction.corrected
    : appliedLayout
      ? appliedLayout.text
      : query;
  const analysis = analyzeQuery(analysisQuery);
  const reasoning = reasonAboutQuery(analysis, analysis.queryFacts);
  const boostedResults = applyKnowledgeBoost(chosen.allResults || [], reasoning);

  return {
    ...chosen,
    query,
    normalized,
    correction,
    analysis,
    reasoning: reasoning.reasoning,
    knowledge: reasoning,
    allResults: boostedResults,
    results: boostedResults.slice(0, options.limit ?? 80),
    total: boostedResults.length,
  };
}

/* --- Подсказки ----------------------------------------------------------- */

const suggestionCorpus = [];
const seenSuggestions = new Set();

function addSuggestion(label, type, detail, url, weight) {
  const key = normalize(label);
  if (!key || seenSuggestions.has(key)) return;
  seenSuggestions.add(key);
  suggestionCorpus.push({
    label,
    normalized: normalize(label),
    type,
    typeLabel: TYPE_LABELS[type] || detail,
    detail,
    url,
    weight,
    tokens: uniqueTokens(label),
  });
}

cakes.forEach((cake) =>
  addSuggestion(cake.name, 'cake', cake.categoryNames.join(' · '), cake.url, 100),
);
categories.forEach((category) =>
  addSuggestion(category.name, 'category', '', category.url, 92),
);
terms.forEach((term) =>
  addSuggestion(term.name, 'term', term.category, term.url, 86),
);
recipes.forEach((recipe) =>
  addSuggestion(recipe.title, 'recipe', recipe.cake ? recipe.cake.name : 'Пошаговый рецепт', recipe.url, 80),
);
articles.forEach((article) =>
  addSuggestion(article.title, 'article', article.category, article.url, 74),
);
videos.forEach((video) =>
  addSuggestion(video.title, 'video', video.channel, video.url, 62),
);

// Подсказки из онтологии: кремы, основы, начинки, проблемы, техники.
const suggestableTypes = new Set(['Cream', 'Base', 'Filling', 'Technique', 'Problem', 'Solution', 'CakeType', 'Texture', 'Flavor']);
getAllEntities()
  .filter((entity) => suggestableTypes.has(entity.type))
  .forEach((entity) => {
    const typeLabel = {
      Cream: 'Крем',
      Base: 'Основа',
      Filling: 'Начинка',
      Technique: 'Техника',
      Problem: 'Проблема',
      Solution: 'Решение',
      CakeType: 'Тип торта',
      Texture: 'Текстура',
      Flavor: 'Вкус',
    }[entity.type];
    addSuggestion(
      entity.name,
      'term',
      typeLabel || entity.type,
      entity.url || `/search?q=${encodeURIComponent(entity.name)}`,
      66,
    );
  });

const suggestionTags = new Set();
cakes.forEach((cake) => cake.tags.forEach((tag) => suggestionTags.add(tag)));
terms.forEach((term) => term.relatedTags.forEach((tag) => suggestionTags.add(tag)));
[...suggestionTags]
  .filter((tag) => tag.length > 3)
  .forEach((tag) =>
    addSuggestion(tag, 'term', 'Поиск по тегу', `/search?q=${encodeURIComponent(tag)}`, 48),
  );

function suggestFor(normalized, limit) {
  const scored = [];
  for (const item of suggestionCorpus) {
    if (item.normalized === normalized) {
      scored.push({ ...item, score: 200 });
      continue;
    }
    let score = 0;
    if (item.normalized.startsWith(normalized)) {
      score = 120 - Math.min(30, item.normalized.length - normalized.length);
    } else if (item.tokens.some((token) => token.startsWith(normalized))) {
      score = 92 - Math.min(25, item.normalized.length - normalized.length);
    } else if (normalized.length >= 3 && item.normalized.includes(normalized)) {
      score = 60;
    } else if (normalized.length >= 3) {
      const word = item.tokens.find((token) => token.length >= 3 && Math.abs(token.length - normalized.length) <= 3);
      if (word) {
        const distance = levenshtein(normalized, word);
        if (distance <= (normalized.length <= 5 ? 1 : 2)) {
          score = 55 - distance * 10;
        }
      }
    }
    if (score > 0) {
      scored.push({ ...item, score: score + item.weight / 20 });
    }
  }

  scored.sort((a, b) => b.score - a.score || b.weight - a.weight);
  return scored.slice(0, limit);
}

export function getSuggestions(query, limit = 8) {
  const normalized = normalize(query);
  if (!normalized) {
    return [...suggestionCorpus]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }

  const primary = suggestFor(normalized, limit);
  const variant = layoutVariant(query);
  if (variant && variant.text !== normalized) {
    const alternative = suggestFor(variant.text, limit);
    if (alternative.length && (!primary.length || alternative[0].score > primary[0].score + 20)) {
      return alternative;
    }
  }
  return primary;
}

export function closestWords(query, limit = 5) {
  const normalized = normalize(query);
  if (!normalized) return [];
  const words = normalized.split(' ').filter((word) => word.length >= 3);
  const found = [];
  for (const word of words) {
    let best = null;
    let bestDistance = Infinity;
    for (const candidate of vocabularyWords) {
      if (Math.abs(candidate.length - word.length) > 3) continue;
      const distance = levenshtein(word, candidate);
      if (distance < bestDistance && distance <= 2) {
        best = candidate;
        bestDistance = distance;
      }
    }
    if (best) found.push({ original: word, suggestion: best, distance: bestDistance });
  }
  return found.slice(0, limit);
}

export const searchCounts = {
  docs: searchDocs.length,
  vocabulary: vocabularyWords.size,
};

export { TYPE_LABELS };
