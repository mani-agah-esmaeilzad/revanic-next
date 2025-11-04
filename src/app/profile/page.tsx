// src/app/profile/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "@/components/ProfileClient";
import { buildStaticMetadata } from "@/lib/page-metadata";

export const metadata = buildStaticMetadata({
  title: "پروفایل کاربری روانک",
  description: "پروفایل خود در مجله روانک را مدیریت کنید، پیشرفت نگارش و اشتراک خود را ببینید.",
  path: "/profile",
  keywords: ["پروفایل روانک", "حساب کاربری روانک"],
});

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
      subscription: true,
      articles: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { name: true } },
          _count: { select: { claps: true, comments: true, views: true } },
          categories: { select: { name: true } },
        },
      },
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
      // --- فقط این خط اضافه شده است ---
      pinnedArticle: true, // یا فقط pinnedArticleId: true
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  return <ProfileClient user={dbUser} />;
};

export default ProfilePage;
