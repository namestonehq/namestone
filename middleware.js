import { NextResponse } from "next/server";

export function middleware(request) {
  const hostname = request.headers.get("host") || "";
  const path = request.nextUrl.pathname;

  // Don't redirect API requests
  if (path.startsWith("/api")) {
    return NextResponse.next();
  }

  // Redirect namestone.xyz to namestone.com
  if (hostname.includes("namestone.xyz")) {
    const newUrl = new URL(request.url);
    newUrl.protocol = "https";
    newUrl.host = "namestone.com";
    console.log("Redirecting to:", newUrl.toString());
    return NextResponse.redirect(newUrl.toString(), {
      status: 301,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/((?!api|_next|static|_vercel).*)"],
};
