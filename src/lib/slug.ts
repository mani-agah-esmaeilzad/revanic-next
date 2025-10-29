// src/lib/slug.ts
const PERSIAN_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

export function slugify(input: string): string {
  const normalized = input
    .toString()
    .trim()
    .replace(PERSIAN_DIACRITICS, "")
    .replace(/\u200c/g, " ")
    .toLowerCase();

  const slug = normalized
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "article";
}

export function appendSlugSuffix(base: string, attempt: number): string {
  return attempt > 0 ? `${base}-${attempt}` : base;
}
