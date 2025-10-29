// src/lib/article-slug.ts
import { prisma } from "@/lib/prisma";
import { appendSlugSuffix, slugify } from "@/lib/slug";

export async function generateArticleSlug(title: string, excludeArticleId?: number): Promise<string> {
  const baseSlug = slugify(title);
  let attempt = 0;
  while (attempt < 50) {
    const candidate = appendSlugSuffix(baseSlug, attempt);
    const existing = await prisma.article.findFirst({
      where: {
        slug: candidate,
        ...(excludeArticleId ? { NOT: { id: excludeArticleId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    attempt += 1;
  }

  return `${baseSlug}-${Date.now()}`;
}
