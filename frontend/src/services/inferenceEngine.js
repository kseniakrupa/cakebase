/**
 * Небольшой продукционный движок прямого вывода (forward chaining).
 * Факты: { id, subject, predicate, object, confidence, source, ruleId?, premises? }
 * Правила: conditions + conclusions; условия проверяются по фактам с переменными ?x.
 */

const VARIABLE = /^\?/;

function isVariable(value) {
  return typeof value === 'string' && VARIABLE.test(value);
}

function factKey(fact) {
  return `${fact.subject}|${fact.predicate}|${fact.object}`;
}

function indexFacts(facts) {
  const index = new Map();
  for (const fact of facts) {
    if (!index.has(fact.predicate)) index.set(fact.predicate, []);
    index.get(fact.predicate).push(fact);
  }
  return index;
}

function conditionValueMatches(boundValue, factValue) {
  return String(boundValue) === String(factValue);
}

function testCondition(condition, fact, bindings) {
  const subject = condition.subject;
  const object = condition.object;

  if (isVariable(subject)) {
    const bound = bindings[subject];
    if (bound !== undefined && !conditionValueMatches(bound, fact.subject)) return null;
  } else if (conditionValueMatches(subject, fact.subject) === false) {
    return null;
  }

  if (isVariable(object)) {
    const bound = bindings[object];
    if (bound !== undefined && !conditionValueMatches(bound, fact.object)) return null;
  } else if (conditionValueMatches(object, fact.object) === false) {
    return null;
  }

  if (condition.operator) {
    const raw = isVariable(object) ? fact.object : condition.object;
    const numeric = Number(raw);
    if (condition.operator === 'gte' && !(numeric >= Number(condition.value))) return null;
    if (condition.operator === 'lte' && !(numeric <= Number(condition.value))) return null;
    if (condition.operator === 'eq' && !(String(raw) === String(condition.value))) return null;
  }

  const next = { ...bindings };
  if (isVariable(subject)) next[subject] = fact.subject;
  if (isVariable(object)) next[object] = fact.object;
  return next;
}

function solveConditions(conditions, factsByPredicate, index = 0, bindings = {}, premises = []) {
  if (index >= conditions.length) return [{ bindings, premises }];
  const condition = conditions[index];
  const candidates = factsByPredicate.get(condition.predicate) || [];
  const solutions = [];
  for (const fact of candidates) {
    const nextBindings = testCondition(condition, fact, bindings);
    if (!nextBindings) continue;
    solutions.push(
      ...solveConditions(conditions, factsByPredicate, index + 1, nextBindings, [...premises, fact]),
    );
    if (solutions.length > 4000) break;
  }
  return solutions;
}

function instantiate(value, bindings) {
  if (!isVariable(value)) return value;
  return bindings[value];
}

export function inferFacts(initialFacts, rules, { maxIterations = 12, maxFacts = 6000 } = {}) {
  let facts = [...initialFacts];
  const known = new Set(facts.map(factKey));
  const derived = [];

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const factsByPredicate = indexFacts(facts);
    let added = 0;

    for (const rule of rules) {
      const solutions = solveConditions(rule.conditions, factsByPredicate);
      for (const solution of solutions) {
        for (const conclusion of rule.conclusions) {
          const subject = instantiate(conclusion.subject, solution.bindings);
          const object = instantiate(conclusion.object, solution.bindings);
          if (subject === undefined || object === undefined) continue;
          const key = `${subject}|${conclusion.predicate}|${object}`;
          if (known.has(key)) continue;
          const premiseConfidence = solution.premises.length
            ? Math.min(...solution.premises.map((fact) => fact.confidence ?? 1))
            : 1;
          const confidence = Number(
            (premiseConfidence * (conclusion.confidence ?? rule.confidence ?? 0.8)).toFixed(2),
          );
          const fact = {
            id: `d${facts.length + 1}`,
            subject,
            predicate: conclusion.predicate,
            object,
            confidence,
            source: 'inference',
            ruleId: rule.id,
            premises: solution.premises.map((premise) => premise.id),
            derived: true,
          };
          facts.push(fact);
          derived.push(fact);
          known.add(key);
          added += 1;
          if (facts.length >= maxFacts) break;
        }
        if (facts.length >= maxFacts) break;
      }
      if (facts.length >= maxFacts) break;
    }
    if (!added) break;
  }

  return { facts, derived };
}

export function runQueryInference(queryFacts, domainFacts, rules) {
  const initial = [...domainFacts, ...queryFacts];
  return inferFacts(initial, rules, { maxIterations: 8, maxFacts: 9000 });
}

export function renderFact(fact, entities, predicateLabels = {}) {
  const subject = entities.get(fact.subject)?.name || fact.subject;
  const object = entities.get(fact.object)?.name || fact.object;
  const predicate = predicateLabels[fact.predicate] || fact.predicate;
  return `${subject} — ${predicate} — ${object}`;
}

export function explainDerivedFact(fact, factsById, rulesById, entities) {
  if (!fact.derived) return null;
  const rule = rulesById.get(fact.ruleId);
  if (!rule) return null;
  const premises = (fact.premises || [])
    .map((id) => factsById.get(id))
    .filter(Boolean)
    .map((premise) => renderFact(premise, entities));
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    ruleDescription: rule.description,
    explanation: rule.explanation,
    premises,
    conclusion: renderFact(fact, entities),
    confidence: fact.confidence,
  };
}

export const PREDICATE_LABELS = {
  hasBase: 'имеет основу',
  hasCream: 'имеет крем',
  hasType: 'имеет тип',
  hasFilling: 'имеет начинку',
  hasFlavor: 'имеет вкус',
  hasTexture: 'обладает текстурой',
  usesTechnique: 'использует технику',
  hasStep: 'проходит этап',
  requiresTechnique: 'требует технику',
  suitableFor: 'подходит для',
  compatibleWith: 'сочетается с',
  incompatibleWith: 'плохо сочетается с',
  hasAlternative: 'имеет альтернативу',
  hasCause: 'может вызывать',
  solvedBy: 'решается с помощью',
  relatedArticle: 'связанная статья',
  relatedTo: 'связано с',
  isA: 'относится к типу',
  hasCategory: 'относится к категории',
  hasDecoration: 'имеет декор',
  hasDecorationComplexity: 'сложность декора',
  hasLayerCount: 'количество слоёв',
  hasPreparationMode: 'приготовлен',
  hasRecipe: 'имеет рецепт',
  recommendation: 'рекомендует',
  possibleCause: 'возможная причина',
  hasIntent: 'намерение',
  hasGoal: 'цель',
  hasType: 'имеет тип',
  hasProblem: 'проблема',
  mentionsEntity: 'упоминает сущность',
  hasTarget: 'объект замены',
  hasConstraint: 'ограничение',
};
