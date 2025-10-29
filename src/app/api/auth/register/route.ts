// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';
import { SignJWT } from 'jose'; // <-- ایمپورت جدید
import { cookies } from 'next/headers'; // <-- ایمپورت جدید
import { logServerEvent, getJourneyIdFromRequest } from '@/lib/analytics';

const resend = new Resend(process.env.RESEND_API_KEY);

const registerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.errors.map((e) => e.message).join(', ');
      return new NextResponse(errorMessage, { status: 400 });
    }

    const { email, password, name } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await logServerEvent({
        name: 'registration_failed',
        journeyId: getJourneyIdFromRequest(req),
        userId: existingUser.id,
        payload: { reason: 'email_exists' },
      });
      return new NextResponse('User with this email already exists', { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    await logServerEvent({
      name: 'registration_completed',
      userId: user.id,
      journeyId: getJourneyIdFromRequest(req),
      payload: { method: 'email' },
    });

    // --- ارسال ایمیل خوش‌آمدگویی ---
    try {
      await resend.emails.send({
        from: 'Revanic <onboarding@resend.dev>',
        to: [user.email],
        subject: 'به روانیک خوش آمدید!',
        react: WelcomeEmail({ name: user.name || '' }),
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    // --- لاگین خودکار کاربر ---
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ userId: user.id, userEmail: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d") // توکن برای ۱ روز معتبر است
      .sign(secret);

    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 روز
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('REGISTRATION_ERROR', error);
    await logServerEvent({
      name: 'registration_failed',
      journeyId: getJourneyIdFromRequest(req),
      payload: { reason: 'server_error' },
    });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
