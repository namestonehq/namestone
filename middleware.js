import { NextResponse } from "next/server";

export function middleware(request) {
  // Clean the hostname by removing any port numbers
  const hostname = (request.headers.get("host") || "").split(":")[0];
  const path = request.nextUrl.pathname;

  // Don't redirect API requests
  if (path.startsWith("/api")) {
    return NextResponse.next();
  }

  // Redirect namestone.xyz to namestone.com
  if (hostname.includes("namestone.xyz")) {
    const newUrl = `https://namestone.com${path}${request.nextUrl.search}`;
    console.log("Redirecting to:", newUrl);
    return NextResponse.redirect(newUrl, {
      status: 301,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/((?!api|_next|static|_vercel).*)"],
};
