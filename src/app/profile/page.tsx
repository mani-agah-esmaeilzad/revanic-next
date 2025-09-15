import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "@/components/ProfileClient";

// Define a type for the JWT payload
interface JwtPayload {
  userId: number;
}

const ProfilePage = async () => {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let userPayload: JwtPayload;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    userPayload = payload as JwtPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userPayload.userId },
    include: {
      articles: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!dbUser) {
    // This could happen if the user was deleted after the token was issued
    redirect("/login");
  }

  return <ProfileClient user={dbUser} />;
};

export default ProfilePage;
