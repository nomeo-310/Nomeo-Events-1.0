// middleware.ts (or proxy.ts — wherever your middleware lives)
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const session = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except the login page itself
  const isAdminRoute = pathname.startsWith("/");
  const isLoginPage = pathname === "/login";

  if (isAdminRoute && !isLoginPage && !session) {
    // Not logged in — redirect to admin login, preserving the intended destination
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && session) {
    // Already logged in — skip the login page
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals, static files, and Better Auth's own routes
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};