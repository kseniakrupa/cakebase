import { stem, tokenize } from './text';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildHighlightPattern(query, extraWords = []) {
  const tokens = new Set([
    ...tokenize(query),
    ...extraWords.flatMap((word) => tokenize(word)),
  ]);
  const stems = [...tokens]
    .filter((token) => token.length >= 3)
    .map((token) => stem(token))
    .filter((token) => token.length >= 3);
  if (!stems.length) return null;
  const alternatives = [...new Set(stems)]
    .sort((a, b) => b.length - a.length)
    .map((item) => `${escapeRegExp(item)}\\p{L}{0,5}`);
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
}

export function highlightParts(text = '', query = '', extraWords = []) {
  const pattern = buildHighlightPattern(query, extraWords);
  if (!pattern) return [{ text, match: false }];
  const parts = [];
  let lastIndex = 0;
  const source = String(text);
  source.replace(pattern, (match, offset) => {
    if (offset > lastIndex) {
      parts.push({ text: source.slice(lastIndex, offset), match: false });
    }
    parts.push({ text: match, match: true });
    lastIndex = offset + match.length;
    return match;
  });
  if (lastIndex < source.length) {
    parts.push({ text: source.slice(lastIndex), match: false });
  }
  return parts.length ? parts : [{ text: source, match: false }];
}
