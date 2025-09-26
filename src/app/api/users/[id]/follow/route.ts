// src/app/api/users/[id]/follow/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const token = cookies().get("token")?.value;
  if (!token) {
    return new NextResponse("Authentication token not found", { status: 401 });
  }

  try {
    const targetUserId = parseInt(params.id, 10);
    if (isNaN(targetUserId)) {
      return new NextResponse("Invalid target user ID", { status: 400 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const followerId = payload.userId as number;

    if (followerId === targetUserId) {
      return new NextResponse("You cannot follow yourself", { status: 400 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // User is already following, so this request is to unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUserId,
          },
        },
      });
      // Optional: Delete the notification if you want
      // await prisma.notification.deleteMany({
      //   where: {
      //     type: 'NEW_FOLLOWER',
      //     userId: targetUserId,
      //     actorId: followerId,
      //   }
      // });
      return NextResponse.json({ following: false });
    } else {
      // User is not following, so this request is to follow
      await prisma.follow.create({
        data: {
          followerId,
          followingId: targetUserId,
        },
      });

      // =======================================================================
      // --- تغییر اصلی در این بخش اعمال شده است ---
      // =======================================================================
      // Create a notification for the user who was followed
      const followerUser = await prisma.user.findUnique({ where: { id: followerId }});
      if (followerUser) {
        await prisma.notification.create({
          data: {
            type: 'NEW_FOLLOWER',
            message: `${followerUser.name || 'کاربری'} شما را دنبال کرد.`,
            userId: targetUserId, // The user being followed
            actorId: followerId,  // The user who initiated the follow
          }
        });
      }
      // =======================================================================

      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("FOLLOW_USER_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}