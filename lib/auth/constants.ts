/**
 * Shared between the session helpers and `proxy.ts`.
 *
 * It lives in its own module because proxy runs before the request reaches the
 * app and must not pull in `next/headers`.
 */
export const SESSION_COOKIE = "sd_session";

/** Areas that require a signed-in account. Used by the optimistic proxy gate. */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/practice",
  "/cbt",
  "/attempt",
  "/history",
  "/performance",
  "/bookmarks",
  "/billing",
  "/profile",
  "/study",
  "/content",
  "/admin",
] as const;
