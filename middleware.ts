import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const COOKIE_NAME = "presence_flow_session"

async function getRole(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const secret = process.env.AUTH_SECRET
  if (!token || !secret || secret.length < 32) return null
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return typeof payload.role === "string" ? payload.role : null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (!pathname.startsWith("/dashboard")) return NextResponse.next()

  const role = await getRole(request)
  if (!role) return NextResponse.redirect(new URL("/login", request.url))

  if (pathname !== "/dashboard" && role === "USER") return NextResponse.redirect(new URL("/dashboard", request.url))
  if (pathname.startsWith("/dashboard/organisations") && role !== "SUPER_ADMIN") return NextResponse.redirect(new URL("/dashboard", request.url))
  if (pathname.startsWith("/dashboard/administrateurs") && role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", request.url))
  if ((pathname.startsWith("/dashboard/personnel") || pathname.startsWith("/dashboard/parametres")) && role !== "ADMIN") return NextResponse.redirect(new URL("/dashboard", request.url))

  return NextResponse.next()
}

export const config = { matcher: ["/dashboard/:path*"] }
