
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod'; 


const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: "رمز عبور فعلی الزامی است." }),
  newPassword: z.string().min(6, { message: "رمز عبور جدید باید حداقل ۶ کاراکتر باشد." }),
});

export async function PUT(req: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return new NextResponse('Authentication token not found', { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as number;

    const body = await req.json();

    
    const validation = passwordChangeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return new NextResponse('رمز عبور فعلی نامعتبر است', { status: 403 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({ message: 'رمز عبور با موفقیت تغییر کرد' });

  } catch (error) {
    console.error('PASSWORD_UPDATE_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}