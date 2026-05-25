import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const COOKIE_PREFIX = "client";

const AUTH_COOKIES = [
  `${COOKIE_PREFIX}.session_token`,
  `${COOKIE_PREFIX}.session`,
  `${COOKIE_PREFIX}.session_data`,
  `__Secure-${COOKIE_PREFIX}.session_token`,
  `__Secure-${COOKIE_PREFIX}.session`,
];

function clearCookiesOnResponse(response: NextResponse) {
  AUTH_COOKIES.forEach((name) => {
    response.cookies.delete(name);
    response.cookies.set(name, "", { expires: new Date(0), path: "/" });
  });
  return response;
}

async function checkProfileStatus(request: NextRequest) {
  try {
    const statusUrl = new URL("/api/auth/check-status", request.url);
    const statusResponse = await fetch(statusUrl.toString(), {
      headers: { Cookie: request.headers.get("cookie") || "" },
    });
    if (statusResponse.ok) return await statusResponse.json();
    return null;
  } catch {
    return null;
  }
}

function getErrorCode(status: {
  activeStatus: string;
  metadata?: { deletionScheduled?: string };
}) {
  if (status.activeStatus === "suspended") return "account_suspended";
  if (status.activeStatus === "deactivated") {
    return status.metadata?.deletionScheduled
      ? "account_scheduled_for_deletion"
      : "account_deactivated";
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = getSessionCookie(request, {
    cookiePrefix: COOKIE_PREFIX,
  });

  // Any protected page with a session — check profile status
  if (
    session &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/auth") &&
    pathname !== "/"
  ) {
    const status = await checkProfileStatus(request);

    if (status?.activeStatus && status.activeStatus !== "active") {
      const errorCode = getErrorCode(status);
      const response = NextResponse.redirect(
        new URL(`/?error=${errorCode}`, request.url)
      );
      return clearCookiesOnResponse(response);
    }

    if (pathname.startsWith("/dashboard") && !status) {
      const response = NextResponse.redirect(new URL("/", request.url));
      return clearCookiesOnResponse(response);
    }
  }

  // No session on dashboard — redirect to login
  if (!session && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};