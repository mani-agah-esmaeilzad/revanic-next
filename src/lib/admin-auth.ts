import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export interface AdminSession {
  id: number;
  role: string;
  name: string | null;
  email: string;
}

const ADMIN_ROLE = "ADMIN" as const;

export async function requireAdminSession(): Promise<AdminSession | null> {
  const token = cookies().get("token")?.value;
  if (!token) {
    return null;
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const userIdClaim = payload?.userId;
    const userId =
      typeof userIdClaim === "number"
        ? userIdClaim
        : typeof userIdClaim === "string"
          ? Number.parseInt(userIdClaim, 10)
          : undefined;

    if (!userId || Number.isNaN(userId)) {
      return null;
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
      },
    });

    if (!adminUser || adminUser.role !== ADMIN_ROLE) {
      return null;
    }

    return adminUser;
  } catch (error) {
    console.error("ADMIN_SESSION_ERROR", error);
    return null;
  }
}
