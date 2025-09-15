import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

interface JwtPayload {
  userId: number;
}

// GET IDs of users the current user is following
export async function GET(req: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ following: [] }); // Not logged in, follows no one
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload as JwtPayload).userId;

    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = follows.map(f => f.followingId);

    return NextResponse.json({ following: followingIds });

  } catch (error) {
    console.error('GET_FOLLOWING_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
