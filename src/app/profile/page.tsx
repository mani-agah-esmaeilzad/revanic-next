// src/app/profile/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "@/components/ProfileClient";

const ProfilePage = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let userId: number;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    userId = payload.userId as number;
  } catch (error) {
    console.error("Token verification failed:", error);
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true, // دریافت اطلاعات اشتراک کاربر
      articles: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { name: true } },
          _count: { select: { claps: true, comments: true, views: true } }, // <-- *** اصلاح نهایی انجام شد ***
          categories: { select: { name: true } },
        },
      },
    },
  });

  if (!dbUser) {
    // اگر کاربر در دیتابیس پیدا نشد (مثلاً حذف شده باشد)
    redirect("/login");
  }

  return <ProfileClient user={dbUser} />;
};

export default ProfilePage;