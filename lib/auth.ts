import { cookies } from "next/headers"
import { jwtVerify, SignJWT } from "jose"

const COOKIE_NAME = "presence_flow_session"

type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER"

export type SessionPayload = {
  userId: string
  role: UserRole
  organizationId: string | null
}

function getSecretKey() {
  const secret = process.env.AUTH_SECRET

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.")
  }

  return new TextEncoder().encode(secret)
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey())

  const cookieStore = await cookies()

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecretKey())

    if (
      typeof payload.userId !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null
    }

    if (!["SUPER_ADMIN", "ADMIN", "USER"].includes(payload.role)) {
      return null
    }

    return {
      userId: payload.userId,
      role: payload.role as UserRole,
      organizationId:
        typeof payload.organizationId === "string"
          ? payload.organizationId
          : null,
    }
  } catch {
    return null
  }
}

export async function clearSession() {
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}
