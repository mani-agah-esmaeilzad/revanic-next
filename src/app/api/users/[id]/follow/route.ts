// src/app/api/users/[id]/follow/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return new NextResponse('Authentication token not found', { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const followerId = payload.userId as number;
    const followingId = parseInt(params.id, 10);

    if (isNaN(followingId)) {
      return new NextResponse('Invalid user ID', { status: 400 });
    }

    if (followerId === followingId) {
      return new NextResponse("You cannot follow yourself", { status: 400 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      });
      return NextResponse.json({ following: false });
    } else {
      await prisma.follow.create({
        data: { followerId, followingId },
      });

      // --- Create Notification ---
      const follower = await prisma.user.findUnique({ where: { id: followerId }, select: { name: true } });
      await prisma.notification.create({
        data: {
          type: 'FOLLOW',
          message: `${follower?.name || 'یک کاربر جدید'} شما را دنبال کرد.`,
          userId: followingId, // Notify the user who is being followed
          actorId: followerId,
        }
      });

      return NextResponse.json({ following: true });
    }

  } catch (error) {
    console.error('FOLLOW_USER_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}