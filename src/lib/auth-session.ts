// src/lib/auth-session.ts
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

let cachedSecret: Uint8Array | null = null;

function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET is not defined. Unable to verify user sessions.");
    return null;
  }
  if (!cachedSecret) {
    cachedSecret = new TextEncoder().encode(secret);
  }
  return cachedSecret;
}

export async function getUserIdFromSessionCookie(): Promise<number | null> {
  const token = cookies().get("token")?.value;
  if (!token) {
    return null;
  }

  const secret = getJwtSecret();
  if (!secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload?.userId;
    return typeof userId === "number" ? userId : null;
  } catch (error) {
    console.error("USER_SESSION_VERIFY_ERROR", error);
    return null;
  }
}
