import { findEntitiesInQuery, getEntity, getFactsFor } from './knowledgeBase';
import { normalize, stem, tokenize } from '../utils/text';

const INTENT_RULES = [
  {
    id: 'problem',
    words: ['почему', 'осел', 'оседает', 'просел', 'опадает', 'жидк', 'трещин', 'рассло', 'не держ', 'сух', 'проблем', 'неровн', 'рван', 'поплыл'],
  },
  {
    id: 'substitution',
    words: ['замен', 'вместо', 'альтернатив'],
  },
  {
    id: 'coverage',
    words: ['покрыт', 'выравн', 'гладк', 'ровн', 'края', 'финишн'],
  },
  {
    id: 'mousse',
    words: ['мусс'],
  },
  {
    id: 'pairing',
    words: ['подход', 'сочета', 'начинк'],
  },
  {
    id: 'base',
    words: ['основа', 'бисквит', 'корж'],
  },
  {
    id: 'recipe',
    words: ['рецепт', 'приготов', 'сделать', 'найди', 'хочу'],
  },
  {
    id: 'decor',
    words: ['декор', 'украс'],
  },
];

const GOAL_RULES = [
  { id: 'smooth-surface', words: ['гладк', 'ровн', 'края', 'поверхност', 'выровн'] },
  { id: 'moist', words: ['влажн', 'сочн', 'пропит'] },
  { id: 'hold-shape', words: ['держ', 'стабильн', 'форму', 'стабильност'] },
  { id: 'creamy', words: ['нежн'] },
  { id: 'no-bake', words: ['без выпечк'] },
  { id: 'easy-decor', words: ['без сложн', 'без мастик', 'простой декор'] },
];

function normalizeForMatch(value) {
  return normalize(value).replace(/ё/g, 'е');
}

function containsAny(normalized, words, tokens = []) {
  return words.some(
    (word) =>
      normalized.includes(normalizeForMatch(word)) ||
      tokensMatchQuery(tokens, word),
  );
}

function tokensMatchQuery(tokens, word) {
  const target = stem(normalizeForMatch(word));
  return tokens.some((token) => token === target || (target.length >= 4 && token.startsWith(target)));
}

function detectProblems(normalized, tokens, entityIds) {
  const problems = new Set(entityIds.filter((id) => getEntity(id)?.type === 'Problem'));
  if (containsAny(normalized, ['жидк'], tokens) && containsAny(normalized, ['крем'], tokens)) problems.add('problem:liquid-cream');
  if (containsAny(normalized, ['осел', 'просел', 'опадает', 'оседает'], tokens) && containsAny(normalized, ['бисквит', 'корж'], tokens)) problems.add('problem:sunken-sponge');
  if (containsAny(normalized, ['сух'], tokens) && containsAny(normalized, ['бисквит', 'корж'], tokens)) problems.add('problem:dry-sponge');
  if (containsAny(normalized, ['трещин'], tokens) && containsAny(normalized, ['чизкейк'], tokens)) problems.add('problem:cracks-cheesecake');
  if (containsAny(normalized, ['рассло'], tokens) && containsAny(normalized, ['крем'], tokens)) problems.add('problem:split-cream');
  if (containsAny(normalized, ['неровн', 'рван'], tokens) && containsAny(normalized, ['поверхност', 'края', 'торт'], tokens)) problems.add('problem:uneven-surface');
  if (containsAny(normalized, ['мусс'], tokens) && containsAny(normalized, ['не держ', 'осел', 'рассло', 'зернист'], tokens)) problems.add('problem:mousse-texture');
  return [...problems];
}

const FILLING_TO_FLAVOR = {
  'filling:berry': 'flavor:berry',
  'filling:cherry': 'flavor:berry',
  'filling:strawberry': 'flavor:berry',
  'filling:raspberry': 'flavor:berry',
  'filling:citrus-curd': 'flavor:citrus',
  'filling:caramel': 'flavor:caramel',
  'filling:chocolate': 'flavor:chocolate',
  'filling:nut': 'flavor:nut',
  'filling:banana': 'flavor:banana',
  'filling:apricot': 'flavor:vanilla',
};

export function analyzeQuery(query) {
  const normalized = normalizeForMatch(query);
  const tokens = tokenize(query, { stemTokens: true });
  const allEntityIds = findEntitiesInQuery(query, { limit: 24 });
  const problems = detectProblems(normalized, tokens, allEntityIds);
  const entityIds = allEntityIds.filter((id) => !problems.includes(id) && getEntity(id)?.type !== 'Category');
  const entities = entityIds.map((id) => getEntity(id)).filter(Boolean);

  const intents = INTENT_RULES.filter((rule) => containsAny(normalized, rule.words, tokens)).map((rule) => rule.id);
  if (problems.length && !intents.includes('problem')) intents.unshift('problem');
  const goals = GOAL_RULES.filter((rule) => containsAny(normalized, rule.words, tokens)).map((rule) => rule.id);
  const constraints = [];
  if (containsAny(normalized, ['без сложн', 'без мастик', 'без сложного декора', 'простой декор'], tokens)) constraints.push('constraint:no-complex-decor');
  if (containsAny(normalized, ['без выпечк'], tokens)) constraints.push('constraint:no-bake');

  const flavors = new Set(entities.filter((entity) => entity.type === 'Flavor').map((entity) => entity.id));
  for (const entity of entities) {
    if (FILLING_TO_FLAVOR[entity.id]) flavors.add(FILLING_TO_FLAVOR[entity.id]);
  }
  if (containsAny(normalized, ['шоколад'], tokens)) flavors.add('flavor:chocolate');
  if (containsAny(normalized, ['ягод', 'малин', 'клубник', 'вишн'], tokens)) flavors.add('flavor:berry');
  if (containsAny(normalized, ['карамел'], tokens)) flavors.add('flavor:caramel');

  let target = null;
  if (intents.includes('substitution')) {
    target =
      entities.find((entity) => ['Cream', 'Ingredient'].includes(entity.type) && getFactsFor(entity.id, 'hasAlternative').length) ||
      entities.find((entity) => entity.type === 'Cream') ||
      null;
  }

  const queryFacts = [];
  let factIndex = 0;
  const add = (predicate, object, confidence = 1) => {
    if (!object) return;
    factIndex += 1;
    queryFacts.push({
      id: `q${factIndex}`,
      subject: 'query',
      predicate,
      object,
      confidence,
      source: 'query',
    });
  };
  intents.forEach((intent) => add('hasIntent', intent));
  goals.forEach((goal) => add('hasGoal', `goal:${goal}`));
  constraints.forEach((constraint) => add('hasConstraint', constraint));
  problems.forEach((problem) => add('hasProblem', problem));
  flavors.forEach((flavor) => add('hasFlavor', flavor));
  entityIds.forEach((entityId) => add('mentionsEntity', entityId));
  if (target) add('hasTarget', target.id);

  let focus = null;
  if (containsAny(normalized, ['крем'], tokens)) focus = 'Cream';
  else if (containsAny(normalized, ['начинк'], tokens)) focus = 'Filling';
  else if (containsAny(normalized, ['основ', 'бисквит', 'корж'], tokens) && !containsAny(normalized, ['торт'], tokens)) focus = 'Base';
  else if (containsAny(normalized, ['декор', 'украс'], tokens)) focus = 'Decoration';

  const cakeIds = entities.filter((entity) => entity.type === 'Cake').map((entity) => entity.id);
  const baseIds = entities.filter((entity) => entity.type === 'Base').map((entity) => entity.id);
  const creamIds = entities.filter((entity) => entity.type === 'Cream').map((entity) => entity.id);
  const fillingIds = entities.filter((entity) => entity.type === 'Filling').map((entity) => entity.id);

  return {
    query,
    normalized,
    tokens,
    intent: intents[0] || 'general',
    intents,
    goals,
    constraints,
    problems,
    flavors: [...flavors],
    entityIds,
    entities,
    cakes: cakeIds,
    bases: baseIds,
    creams: creamIds,
    fillings: fillingIds,
    target,
    focus,
    queryFacts,
  };
}

export function describeAnalysis(analysis) {
  const labels = {
    problem: 'поиск причины проблемы',
    substitution: 'подбор замены',
    coverage: 'покрытие и выравнивание',
    mousse: 'муссовый торт',
    base: 'подбор основы',
    pairing: 'сочетание компонентов',
    decor: 'декор',
    recipe: 'поиск рецепта',
    general: 'общий поиск',
  };
  const goalLabels = {
    'smooth-surface': 'гладкая поверхность',
    moist: 'влажная текстура',
    'hold-shape': 'удержание формы',
    creamy: 'кремовая текстура',
    'no-bake': 'без выпечки',
    'easy-decor': 'простой декор',
  };
  return {
    intent: labels[analysis.intent] || analysis.intent,
    goals: analysis.goals.map((goal) => goalLabels[goal] || goal),
    constraints: analysis.constraints.map((constraint) => constraint.replace('constraint:', '')),
  };
}
