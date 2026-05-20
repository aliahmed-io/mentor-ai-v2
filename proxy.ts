import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";

// Simple in-memory sliding-window rate limiting map (IP -> Request Timestamps)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_THRESHOLD = 60; // Max 60 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/auth");
  const isApiAuth = pathname.startsWith("/api/auth");

  // Root landing: allow everyone to view the award-winning landing page
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Allow auth routes
  if (isAuthPage || isApiAuth) return NextResponse.next();

  // Protect API routes (non-NextAuth) and apply rate limiting
  if (pathname.startsWith("/api")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve client IP
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const now = Date.now();

    // Clean old entries outside the sliding window
    let clientRequests = rateLimitMap.get(clientIp) || [];
    clientRequests = clientRequests.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW,
    );

    if (clientRequests.length >= RATE_LIMIT_THRESHOLD) {
      return NextResponse.json(
        {
          error:
            "Too Many Requests. Please wait a minute before making more requests.",
        },
        { status: 429 },
      );
    }

    // Add current request timestamp
    clientRequests.push(now);
    rateLimitMap.set(clientIp, clientRequests);

    return NextResponse.next();
  }

  // Protect all other routes
  if (!session) {
    const cb = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${cb}`, request.url),
    );
  }

  return NextResponse.next();
}

// Add routes that should be protected by authentication
export const config = {
  // Exclude Next internals and static assets; protect everything else
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/:path*",
  ],
};
