// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // مسیرهای مقالات به لیست مسیرهای محافظت‌شده اضافه شد
  const protectedRoutes = ['/profile', '/write', '/admin', '/api/admin', '/articles'];

  // اگر مسیر نیاز به احراز هویت دارد
  if (protectedRoutes.some(p => pathname.startsWith(p))) {
    if (!token) {
      // اگر توکن وجود ندارد، به صفحه ثبت‌نام هدایت کن
      return NextResponse.redirect(new URL('/register', request.url));
    }

    try {
      // فقط اعتبار توکن را بررسی کن، بدون اتصال به دیتابیس
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      // اگر توکن معتبر بود، اجازه دسترسی بده
      return NextResponse.next();
    } catch (error) {
      console.error("JWT Verification Error in Middleware:", error);
      // اگر توکن نامعتبر بود، آن را پاک کن و به صفحه ثبت‌نام هدایت کن
      const response = NextResponse.redirect(new URL('/register', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

// matcher را آپدیت می‌کنیم تا شامل مسیرهای مقالات هم بشود
export const config = {
  matcher: ['/profile/:path*', '/write/:path*', '/admin/:path*', '/articles/:path*'],
};