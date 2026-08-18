import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login"];
const ADMIN_AREA_PATHS = ["/users", "/settings"];

export default auth((req) => {
  const { nextUrl } = req;

  // Les routes API gèrent leur propre auth (JSON, jamais de redirection HTML)
  if (nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth?.user;
  const isPublicPath = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

  if (!isLoggedIn) {
    if (isPublicPath) return NextResponse.next();
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!req.auth?.user.isActive) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("error", "AccountDisabled");
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  const role = req.auth?.user.role;
  const isAdminArea = ADMIN_AREA_PATHS.some((p) => nextUrl.pathname.startsWith(p));
  if (isAdminArea && role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
