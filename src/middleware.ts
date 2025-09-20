
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  
  const protectedRoutes = ['/profile', '/write', '/admin', '/api/admin', '/articles'];

  
  if (protectedRoutes.some(p => pathname.startsWith(p))) {
    if (!token) {
      
      return NextResponse.redirect(new URL('/register', request.url));
    }

    try {
      
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      
      return NextResponse.next();
    } catch (error) {
      console.error("JWT Verification Error in Middleware:", error);
      
      const response = NextResponse.redirect(new URL('/register', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: ['/profile/:path*', '/write/:path*', '/admin/:path*', '/articles/:path*'],
};