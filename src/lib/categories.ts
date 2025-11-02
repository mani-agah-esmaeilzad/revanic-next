import { prisma } from "./prisma";
import { BookOpen } from "lucide-react";
import { CATEGORY_LIBRARY, CategoryDefinition } from "./category-library";
import { slugify } from "./slug";

const FALLBACK_COLOR = "bg-slate-500";

export async function ensureDefaultCategories() {
  await prisma.category.createMany({
    data: CATEGORY_LIBRARY.map((category) => ({ name: category.name })),
    skipDuplicates: true,
  });
}

export function resolveCategoryDefinition(name: string): CategoryDefinition {
  const normalizedName = name.trim();
  const normalizedSlug = slugify(normalizedName);
  const normalizedCompact = normalizedName.replace(/\s+/g, "");
  const normalizedSlugCompact = normalizedSlug.replace(/-/g, "");

  const match = CATEGORY_LIBRARY.find((category) =>
    category.keys.includes(normalizedName) ||
    category.keys.includes(normalizedSlug) ||
    category.keys.includes(normalizedCompact) ||
    category.keys.includes(normalizedSlugCompact),
  );

  if (match) {
    return match;
  }

  return {
    slug: normalizedSlug,
    name: normalizedName,
    description: `جدیدترین مقالات مرتبط با ${normalizedName}`,
    color: FALLBACK_COLOR,
    icon: BookOpen,
    aliases: [],
    keys: buildFallbackKeys(normalizedName, normalizedSlug, normalizedCompact, normalizedSlugCompact),
  };
}

export function getAllCategoryDefinitions(): CategoryDefinition[] {
  return CATEGORY_LIBRARY;
}

const buildFallbackKeys = (
  name: string,
  slug: string,
  compact: string,
  slugCompact: string,
) => Array.from(new Set([name, slug, compact, slugCompact]));
