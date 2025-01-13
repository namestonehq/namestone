import { NextResponse } from "next/server";

export function middleware(request) {
  const hostname = request.headers.get("host") || "";
  const path = request.nextUrl.pathname;

  // Don't redirect API requests
  if (path.startsWith("/api")) {
    return NextResponse.next();
  }

  // Redirect namestone.xyz to namestone.com
  if (hostname === "namestone.xyz") {
    return NextResponse.redirect(
      `https://namestone.com${path}${request.nextUrl.search}`,
      {
        status: 301,
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except:
    // 1. /api (API routes)
    // 2. /_next (Next.js internals)
    // 3. /static (public files)
    // 4. /_vercel (Vercel internals)
    "/((?!api|_next|static|_vercel).*)",
  ],
};
