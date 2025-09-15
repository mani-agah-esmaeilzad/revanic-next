import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');

  const where: any = {};

  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  try {
    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            followers: true,
            articles: { where: { published: true } }
          }
        },
      },
      orderBy: {
        followers: {
          _count: 'desc'
        }
      }
    });

    // For now, we are not handling the isFollowing status for each author in this list API
    // to keep it simple. Each FollowButton will be responsible for its own state.

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET_USERS_ERROR", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
