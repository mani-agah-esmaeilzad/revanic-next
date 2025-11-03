// src/app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { randomUUID } from "crypto";

const STATE_COOKIE_NAME = "google_oauth_state";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

type GoogleTokenResponse = {
  access_token: string;
  id_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
};

const buildRedirectResponse = (request: NextRequest, error?: string) => {
  const redirectUrl = new URL(error ? "/login" : "/profile", request.nextUrl.origin);
  if (error) {
    redirectUrl.searchParams.set("error", error);
  }
  return NextResponse.redirect(redirectUrl);
};

const getRedirectUri = (req: NextRequest) => {
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
  return `${origin}/api/auth/google/callback`;
};

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Google OAuth environment variables are missing.");
    return buildRedirectResponse(req, "google_oauth_not_configured");
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get(STATE_COOKIE_NAME)?.value;
  const providerError = req.nextUrl.searchParams.get("error");

  if (providerError) {
    console.warn("Google OAuth returned an error:", providerError);
    const response = buildRedirectResponse(req, "google_oauth_denied");
    response.cookies.delete(STATE_COOKIE_NAME);
    return response;
  }

  if (!state || !storedState || state !== storedState) {
    console.error("Google OAuth state mismatch or missing.");
    const response = buildRedirectResponse(req, "google_oauth_state_mismatch");
    response.cookies.delete(STATE_COOKIE_NAME);
    return response;
  }

  if (!code) {
    console.error("Google OAuth code is missing from callback.");
    const response = buildRedirectResponse(req, "google_oauth_missing_code");
    response.cookies.delete(STATE_COOKIE_NAME);
    return response;
  }

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getRedirectUri(req),
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      console.error("Failed to exchange Google OAuth code:", body);
      const response = buildRedirectResponse(req, "google_oauth_token_exchange_failed");
      response.cookies.delete(STATE_COOKIE_NAME);
      return response;
    }

    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

    const userInfoResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      const body = await userInfoResponse.text();
      console.error("Failed to fetch Google user info:", body);
      const response = buildRedirectResponse(req, "google_oauth_userinfo_failed");
      response.cookies.delete(STATE_COOKIE_NAME);
      return response;
    }

    const profile = (await userInfoResponse.json()) as GoogleUserInfo;

    if (!profile.email) {
      console.error("Google user info did not include an email address.");
      const response = buildRedirectResponse(req, "google_oauth_missing_email");
      response.cookies.delete(STATE_COOKIE_NAME);
      return response;
    }

    let user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (user) {
      const updates: Record<string, string | null> = {};
      if (!user.name && profile.name) {
        updates.name = profile.name;
      }
      if (!user.avatarUrl && profile.picture) {
        updates.avatarUrl = profile.picture;
      }

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    } else {
      const randomPassword = await bcrypt.hash(randomUUID(), 10);
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.picture,
          password: randomPassword,
        },
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set. Unable to sign login token.");
      const response = buildRedirectResponse(req, "server_error");
      response.cookies.delete(STATE_COOKIE_NAME);
      return response;
    }

    const jwtToken = await new SignJWT({ userId: user.id, userEmail: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(jwtSecret));

    const response = buildRedirectResponse(req);
    response.cookies.delete(STATE_COOKIE_NAME);
    response.cookies.set("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Unexpected error during Google OAuth callback:", error);
    const response = buildRedirectResponse(req, "google_oauth_unexpected_error");
    response.cookies.delete(STATE_COOKIE_NAME);
    return response;
  }
}
