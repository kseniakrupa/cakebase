export const STOP_WORDS = new Set([
  'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все', 'она',
  'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'ее',
  'мне', 'было', 'вот', 'от', 'меня', 'еще', 'нет', 'о', 'из', 'ему', 'теперь', 'когда',
  'даже', 'ну', 'вдруг', 'ли', 'если', 'уже', 'или', 'ни', 'быть', 'был', 'него', 'до',
  'вас', 'нибудь', 'опять', 'уж', 'вам', 'ведь', 'там', 'потом', 'себя', 'ничего', 'ей',
  'может', 'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для', 'мы', 'тебя', 'их', 'чем',
  'была', 'сам', 'чтоб', 'без', 'будто', 'чего', 'раз', 'тоже', 'себе', 'под', 'будет',
  'ж', 'тогда', 'кто', 'этот', 'того', 'потому', 'этого', 'какой', 'совсем', 'ним',
  'здесь', 'этом', 'один', 'почти', 'мой', 'тем', 'чтобы', 'нее', 'сейчас', 'были',
  'куда', 'зачем', 'всех', 'никогда', 'можно', 'при', 'наконец', 'два', 'об', 'другой',
  'хоть', 'после', 'над', 'больше', 'тот', 'через', 'эти', 'нас', 'про', 'всего', 'них',
  'какая', 'много', 'разве', 'три', 'эту', 'моя', 'впрочем', 'хорошо', 'свою', 'этой',
  'перед', 'иногда', 'лучше', 'чуть', 'том', 'нельзя', 'такой', 'им', 'более', 'всегда',
  'конечно', 'всю', 'между', 'мой', 'который', 'которая', 'которые', 'которое', 'это',
  'этих', 'этим', 'свой', 'свои', 'своих', 'такие', 'таких', 'такого', 'таком', 'всё',
  'нужно', 'хочу', 'хотел', 'хотела', 'сделать', 'сделай', 'сделаю', 'сделаем', 'сделала', 'сделали', 'приготовить', 'рецепт', 'видео',
]);

const SUFFIXES = [
  'иями', 'ями', 'ами', 'ией', 'иям', 'ием', 'иях', 'ыми', 'ими', 'его', 'ого', 'ему',
  'ому', 'ию', 'ью', 'ия', 'ья', 'ев', 'ов', 'ие', 'ье', 'еи', 'ии', 'ей', 'ой', 'ий',
  'ый', 'ая', 'яя', 'ое', 'ее', 'ые', 'ие', 'ую', 'юю', 'их', 'ых', 'ым', 'им', 'ми',
  'ам', 'ом', 'ах', 'ях', 'ий', 'ия', 'ий', 'у', 'ю', 'а', 'я', 'ы', 'и', 'е', 'о', 'ь',
];

export function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[’'`]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function stem(word = '') {
  let result = normalize(word);
  if (result.length <= 3) return result;
  let changed = true;
  let guard = 0;
  while (changed && guard < 2) {
    changed = false;
    for (const suffix of SUFFIXES) {
      if (result.endsWith(suffix) && result.length - suffix.length >= 3) {
        result = result.slice(0, -suffix.length);
        changed = true;
        break;
      }
    }
    guard += 1;
  }
  return result;
}

export function tokenize(text = '', { keepStopWords = false, stemTokens = false } = {}) {
  const normalized = normalize(text);
  if (!normalized) return [];
  const tokens = normalized.split(' ').filter((token) => {
    if (!token) return false;
    if (!keepStopWords && STOP_WORDS.has(token)) return false;
    return token.length > 1;
  });
  return stemTokens ? tokens.map(stem) : tokens;
}

export function uniqueTokens(text) {
  return [...new Set(tokenize(text, { stemTokens: true }))];
}

export function levenshtein(a = '', b = '') {
  const left = normalize(a);
  const right = normalize(b);
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    previous = current;
  }
  return previous[right.length];
}

export function wordsMatch(left, right) {
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;
  return shorter.length >= 4 && longer.startsWith(shorter);
}

const LATIN_TO_CYRILLIC = {
  q: 'й', w: 'ц', e: 'у', r: 'к', t: 'е', y: 'н', u: 'г', i: 'ш', o: 'щ', p: 'з',
  '[': 'х', ']': 'ъ', a: 'ф', s: 'ы', d: 'в', f: 'а', g: 'п', h: 'р', j: 'о',
  k: 'л', l: 'д', ';': 'ж', "'": 'э', z: 'я', x: 'ч', c: 'с', v: 'м', b: 'и',
  n: 'т', m: 'ь', ',': 'б', '.': 'ю', '`': 'ё',
};

const CYRILLIC_TO_LATIN = Object.fromEntries(
  Object.entries(LATIN_TO_CYRILLIC).map(([latin, cyrillic]) => [cyrillic, latin]),
);

export function layoutVariant(query = '') {
  const raw = String(query).toLowerCase();
  const latinCount = (raw.match(/[a-z]/g) || []).length;
  const cyrillicCount = (raw.match(/[а-яё]/g) || []).length;
  if (!latinCount && !cyrillicCount) return null;

  const mapping = latinCount >= cyrillicCount ? LATIN_TO_CYRILLIC : CYRILLIC_TO_LATIN;
  const direction = latinCount >= cyrillicCount ? 'latin-to-cyrillic' : 'cyrillic-to-latin';
  const converted = [...raw].map((char) => mapping[char] || char).join('');
  const text = normalize(converted);
  if (!text || text === normalize(query)) return null;
  return { text, direction };
}
