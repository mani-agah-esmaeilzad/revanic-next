// scripts/backfill-article-slugs.ts
import { prisma } from "../src/lib/prisma";
import { appendSlugSuffix, slugify } from "../src/lib/slug";

async function generateUniqueSlug(title: string, excludeArticleId?: number): Promise<string> {
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

async function main() {
  const articlesWithoutSlug = await prisma.article.findMany({
    where: { slug: null },
    select: { id: true, title: true },
  });

  if (articlesWithoutSlug.length === 0) {
    console.log("All articles already have a slug. Nothing to do.");
    return;
  }

  console.log(`Found ${articlesWithoutSlug.length} article(s) without slug. Backfilling...`);

  for (const article of articlesWithoutSlug) {
    const slug = await generateUniqueSlug(article.title, article.id);
    await prisma.article.update({
      where: { id: article.id },
      data: { slug },
    });
    console.log(`↳ Article #${article.id} → ${slug}`);
  }

  console.log("Backfill complete.");
}

main()
  .catch((error) => {
    console.error("BACKFILL_SLUGS_ERROR", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
