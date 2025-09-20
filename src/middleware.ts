// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/profile', '/write', '/admin', '/api/admin'];

  const isProtectedRoute = protectedRoutes.some(p => pathname.startsWith(p));

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      // *** اصلاح کلیدی: بررسی نوع و وجود userId ***
      const userId = payload.userId;
      if (typeof userId !== 'number') {
        throw new Error('Invalid token payload: userId is missing or not a number');
      }

      // بررسی وجود کاربر در دیتابیس
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new Error('User not found in database');
      }

      return NextResponse.next();

    } catch (error) {
      console.error("Middleware Auth Error:", error);
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/write/:path*', '/admin/:path*', '/api/admin/:path*'],
};