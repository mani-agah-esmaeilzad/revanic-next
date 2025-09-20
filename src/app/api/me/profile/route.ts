
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { z } from "zod"; 


const profileUpdateSchema = z.object({
  name: z.string().min(3, { message: "نام باید حداقل ۳ کاراکتر باشد." }).max(50, { message: "نام نمی‌تواند بیشتر از ۵۰ کاراکتر باشد." }),
  bio: z.string().max(300, { message: "بیوگرافی نمی‌تواند بیشتر از ۳۰۰ کاراکتر باشد." }).optional().nullable(),
});

export async function PUT(req: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return new NextResponse("Authentication token not found", { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;

    const body = await req.json();
    
    
    const validation = profileUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }

    const { name, bio } = validation.data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        bio: bio,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("PROFILE_UPDATE_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}