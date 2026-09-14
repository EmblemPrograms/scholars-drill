/**
 * Session handling. Server-side only: never import this from a client component.
 *
 * The JWT lives in an httpOnly cookie, so page scripts cannot read it. Scholars
 * Drill never signs or verifies tokens itself; the DSA API owns that. We hold
 * the token and ask `/api/auth/me` who it belongs to.
 */
import { cookies } from "next/headers";
import { apiFetch, ApiError } from "@/lib/api/client";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export { SESSION_COOKIE };

/** Fallback lifetime when the token carries no expiry we can read. */
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  fullname: string;
  email: string;
  role: string;
  studentId?: string | null;
  profilePic?: string | null;
  programmes?: string[];
  examTrack?: string | null;
  currentLevel?: string | null;
};

/**
 * Read the token's own expiry so the cookie dies with it.
 *
 * This only reads the payload, it does not verify the signature. That is fine
 * here: the value decides a cookie lifetime, never whether someone is allowed in.
 */
function maxAgeFromToken(token: string): number {
  try {
    const payload = token.split(".")[1];
    if (!payload) return DEFAULT_MAX_AGE;
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as { exp?: number };
    if (typeof json.exp !== "number") return DEFAULT_MAX_AGE;
    const seconds = json.exp - Math.floor(Date.now() / 1000);
    return seconds > 0 ? seconds : DEFAULT_MAX_AGE;
  } catch {
    return DEFAULT_MAX_AGE;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeFromToken(token),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

/**
 * Who is signed in, or null.
 *
 * The API is the authority: a cookie that no longer authenticates returns null
 * rather than a stale user. Callers treat null as signed out.
 */
export async function getSession(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const response = await apiFetch<{ success: boolean; data: SessionUser }>("/auth/me", {
      token,
    });
    return response?.data ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      // The API was unreachable. Do not sign the student out over a dropped
      // connection; the route guard will ask again on the next request.
      throw error;
    }
    return null;
  }
}
