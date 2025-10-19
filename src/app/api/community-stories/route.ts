import { NextResponse } from "next/server";
import { ensureCommunityStories, getCommunityStories } from "@/lib/community";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  await ensureCommunityStories();

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const publicationSlug = searchParams.get("publicationSlug");

  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  let publicationId: number | undefined;

  if (publicationSlug) {
    const publication = await prisma.publication.findUnique({
      where: { slug: publicationSlug },
      select: { id: true },
    });

    if (!publication) {
      return NextResponse.json({ stories: [] });
    }

    publicationId = publication.id;
  }

  const stories = await getCommunityStories({ limit, publicationId });

  return NextResponse.json({ stories });
}
