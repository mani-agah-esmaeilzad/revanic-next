// src/app/api/me/publications/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = cookies().get("token")?.value;
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;

    const userPublications = await prisma.usersOnPublications.findMany({
      where: { userId },
      select: { // فقط اطلاعات مورد نیاز را انتخاب می‌کنیم
        publication: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // پاسخ را به فرمتی که در کامپوننت کلاینت انتظار دارید، تبدیل می‌کنیم
    const publications = userPublications.map(up => up.publication);

    return NextResponse.json(publications);
  } catch (error) {
    console.error("FETCH_USER_PUBLICATIONS_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}