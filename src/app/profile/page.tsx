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
      articles: {
        orderBy: { createdAt: "desc" },
        // --- FIX START ---
        // اطلاعات کامل هر مقاله را برای تطابق با تایپ‌ها دریافت می‌کنیم
        include: {
          author: { select: { name: true } },
          _count: { select: { likes: true, comments: true } },
          categories: { select: { name: true } },
        },
        // --- FIX END ---
      },
    },
  });

  if (!dbUser) {
    // This could happen if the user was deleted after the token was issued
    redirect("/login");
  }

  // حالا نوع داده dbUser با نوع UserData مورد انتظار در ProfileClient مطابقت دارد
  return <ProfileClient user={dbUser} />;
};

export default ProfilePage;