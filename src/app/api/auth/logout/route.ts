import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear the token cookie
    cookies().set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: -1, // Expire the cookie immediately
    });

    return NextResponse.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('LOGOUT_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
