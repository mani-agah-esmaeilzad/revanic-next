import { prisma } from "@/lib/prisma";
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
  const match = CATEGORY_LIBRARY.find((category) => category.slug === normalizedSlug);

  if (match) {
    return match;
  }

  return {
    slug: normalizedSlug,
    name: normalizedName,
    description: `جدیدترین مقالات مرتبط با ${normalizedName}`,
    color: FALLBACK_COLOR,
    icon: BookOpen,
  };
}

export function getAllCategoryDefinitions(): CategoryDefinition[] {
  return CATEGORY_LIBRARY;
}
