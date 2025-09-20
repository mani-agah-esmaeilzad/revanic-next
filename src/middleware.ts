import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export const config = {
  matcher: [
    '/profile/:path*', 
    '/write/:path*', 
    '/admin/:path*', 
    '/api/admin/:path*'
  ],
};

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    if (!secret) {
        throw new Error('JWT_SECRET is not set in environment variables.');
    }

    await jwtVerify(token, secret);
    return NextResponse.next();

  } catch (error) {
    console.error("Middleware Auth Error:", error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}