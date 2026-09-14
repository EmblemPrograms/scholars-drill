import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, PROTECTED_PREFIXES } from "@/lib/auth/constants";

/**
 * Next 16 renamed Middleware to Proxy. Same behaviour, new file name.
 *
 * This is an OPTIMISTIC gate and nothing more: it only asks whether a session
 * cookie exists, so a signed-out visitor is sent to the login page instead of a
 * flash of an empty dashboard. It is not authorisation. Every protected page
 * and every API call re-checks server-side, which is what actually keeps people
 * out. The Next.js docs are explicit that proxy is not a session or auth layer.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Come back to where they were headed once they are in.
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // Deliberately NOT redirecting /login to /dashboard when a cookie exists.
  // Proxy can only see that a cookie is present, not that it still works, and a
  // stale cookie would then bounce forever: proxy sends /login to /dashboard,
  // the student layout finds the session invalid and sends it back. Cookies
  // cannot be cleared during rendering, so the page cannot break the cycle
  // either. The login page does this redirect itself, after asking the API.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/practice/:path*",
    "/cbt/:path*",
    "/attempt/:path*",
    "/history/:path*",
    "/performance/:path*",
    "/bookmarks/:path*",
    "/billing/:path*",
    "/profile/:path*",
    "/study/:path*",
    "/content/:path*",
    "/admin/:path*",
  ],
};
