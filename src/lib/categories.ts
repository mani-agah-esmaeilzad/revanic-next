import { prisma } from "@/lib/prisma";
import { CATEGORY_LIBRARY, CategoryDefinition } from "./category-library";
import { BookOpen } from "lucide-react";

const FALLBACK_COLOR = "bg-slate-500";

export async function ensureDefaultCategories() {
  await prisma.category.createMany({
    data: CATEGORY_LIBRARY.map((category) => ({ name: category.name })),
    skipDuplicates: true,
  });
}

export function resolveCategoryDefinition(name: string): CategoryDefinition & { description: string } {
  const match = CATEGORY_LIBRARY.find((category) => category.name === name);

  if (match) {
    return match;
  }

  return {
    name,
    description: `جدیدترین مقالات مرتبط با ${name}`,
    color: FALLBACK_COLOR,
    icon: BookOpen,
  };
}

export function getAllCategoryDefinitions(): CategoryDefinition[] {
  return CATEGORY_LIBRARY;
}
