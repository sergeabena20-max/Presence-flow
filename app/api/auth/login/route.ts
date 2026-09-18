import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createSession } from "@/lib/auth"

async function ensureConfiguredSuperAdmin(email: string) {
  const configuredEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
  const configuredPassword = process.env.SUPER_ADMIN_PASSWORD

  if (!configuredEmail || !configuredPassword || email !== configuredEmail) {
    return null
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: configuredEmail },
    select: {
      id: true,
      passwordHash: true,
      role: true,
      organizationId: true,
      isActive: true,
      mustChangePassword: true,
    },
  })

  if (existingUser) return existingUser

  const passwordHash = await bcrypt.hash(configuredPassword, 12)

  return prisma.user.create({
    data: {
      id: "super-admin-env",
      email: configuredEmail,
      passwordHash,
      firstName: "Super",
      lastName: "Administrateur",
      role: "SUPER_ADMIN",
      isActive: true,
      mustChangePassword: false,
    },
    select: {
      id: true,
      passwordHash: true,
      role: true,
      organizationId: true,
      isActive: true,
      mustChangePassword: true,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 })
    }

    const user = await ensureConfiguredSuperAdmin(email) ?? await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        role: true,
        organizationId: true,
        isActive: true,
        mustChangePassword: true,
      },
    })

    if (!user) {
      const pending = await prisma.registrationRequest.findUnique({ where: { email }, select: { status: true } })
      if (pending?.status === "PENDING") {
        return NextResponse.json({ error: "Votre demande est en attente de validation par un administrateur. Vous pourrez vous connecter après son approbation." }, { status: 403 })
      }
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Votre compte est désactivé. Contactez l’administrateur de votre organisation." }, { status: 403 })
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)

    if (!validPassword) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 })
    }

    await createSession({
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
      mustChangePassword: user.mustChangePassword,
    })

    return NextResponse.json({
      success: true,
      mustChangePassword: user.mustChangePassword,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 })
  }
}
