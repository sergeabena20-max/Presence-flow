import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

// Pages accessibles uniquement à SUPER_ADMIN et ADMIN.
// (Les vérifications fines de permission pour ADMIN se font aussi côté serveur.)
const ADMIN_AREA_PATHS = ["/users", "/settings"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const isPublicPath = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

  // Non authentifié -> seules les pages publiques (login) sont autorisées.
  if (!isLoggedIn) {
    if (isPublicPath) return NextResponse.next();
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authentifié mais compte désactivé après émission du token.
  if (!req.auth?.user.isActive) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("error", "AccountDisabled");
    return NextResponse.redirect(loginUrl);
  }

  // Déjà connecté -> ne pas laisser revenir sur /login.
  if (isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // EMPLOYEE / STUDENT ne peuvent pas accéder aux zones admin.
  const role = req.auth?.user.role;
  const isAdminArea = ADMIN_AREA_PATHS.some((p) => nextUrl.pathname.startsWith(p));
  if (isAdminArea && role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Sur toutes les routes sauf assets statiques et les routes API NextAuth
  // elles-mêmes (doivent rester accessibles pour se connecter).
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
