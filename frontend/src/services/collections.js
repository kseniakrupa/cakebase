export function sortByDateDesc(items) {
  return [...items].sort((a, b) => new Date(b.publicationDate || b.date) - new Date(a.publicationDate || a.date));
}
