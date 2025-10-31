import { auth } from "@/server/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname, search } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/auth");
  const isApiAuth = pathname.startsWith("/api/auth");

  // Root landing: unauth -> signin; auth -> presentation
  if (pathname === "/") {
    if (session) return NextResponse.redirect(new URL("/presentation", request.url));
    const cb = encodeURIComponent(request.url);
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${cb}`, request.url));
  }

  // Allow auth routes
  if (isAuthPage || isApiAuth) return NextResponse.next();

  // Protect API routes (non-NextAuth)
  if (pathname.startsWith("/api")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!session) {
    const cb = encodeURIComponent(request.url);
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${cb}`, request.url));
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
