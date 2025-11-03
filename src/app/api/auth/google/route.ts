// src/app/api/auth/google/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const STATE_COOKIE_NAME = "google_oauth_state";

const getRedirectUri = (req: NextRequest) => {
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
  return `${origin}/api/auth/google/callback`;
};

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error("GOOGLE_CLIENT_ID is not defined. Google OAuth cannot proceed.");
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 500 });
  }

  const redirectUri = getRedirectUri(req);
  const state = randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const googleAuthUrl = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;

  const response = NextResponse.redirect(googleAuthUrl);
  response.cookies.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return response;
}
