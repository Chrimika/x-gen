import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/myspace"];
// Routes that require admin access
const adminRoutes = ["/myspace"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires authentication
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    // Check for Firebase auth session cookie
    // Firebase Auth on the client stores the token; we check via a custom cookie
    // that gets set after login
    const authCookie = request.cookies.get("xgen-auth");

    if (!authCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For admin routes, check admin cookie
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      const adminCookie = request.cookies.get("xgen-admin");
      if (!adminCookie?.value) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/myspace/:path*"],
};
