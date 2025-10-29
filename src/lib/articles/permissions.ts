// src/lib/articles/permissions.ts
import { prisma } from '@/lib/prisma';
import { ArticleCollaboratorRole } from '@prisma/client';

export type ArticleAccessRole = 'OWNER' | ArticleCollaboratorRole | null;

export interface ArticleAccessResult {
  article: { id: number; authorId: number };
  role: ArticleAccessRole;
}

export async function getArticleAccess(articleId: number, userId: number): Promise<ArticleAccessResult | null> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, authorId: true },
  });

  if (!article) return null;
  if (article.authorId === userId) {
    return { article, role: 'OWNER' };
  }

  const collaborator = await prisma.articleCollaborator.findUnique({
    where: {
      articleId_userId: {
        articleId,
        userId,
      },
    },
    select: { role: true },
  });

  if (!collaborator) {
    return { article, role: null };
  }

  return { article, role: collaborator.role };
}

export async function requireArticleAccess(articleId: number, userId: number) {
  const access = await getArticleAccess(articleId, userId);
  if (!access) {
    throw Object.assign(new Error('Article not found'), { status: 404 });
  }
  return access;
}

export async function requireEditorAccess(articleId: number, userId: number) {
  const access = await requireArticleAccess(articleId, userId);
  if (access.role !== 'OWNER' && access.role !== ArticleCollaboratorRole.EDITOR) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return access;
}

export async function requireOwnerAccess(articleId: number, userId: number) {
  const access = await requireArticleAccess(articleId, userId);
  if (access.role !== 'OWNER') {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return access;
}
