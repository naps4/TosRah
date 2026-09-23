export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function uniqueSlug(text: string): string {
  return `${slugify(text) || 'item'}-${Math.random().toString(36).slice(2, 7)}`;
}