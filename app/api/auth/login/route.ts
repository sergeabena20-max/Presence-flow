import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis." },
        { status: 400 },
      )
    }

    // Bootstrap sécurisé du Super Administrateur si le seed n'a pas encore été exécuté.
    // Les identifiants viennent uniquement des variables d'environnement Vercel.
    const configuredSuperAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
    const configuredSuperAdminPassword = process.env.SUPER_ADMIN_PASSWORD

    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        role: true,
        organizationId: true,
        isActive: true,
      },
    })

    if (
      !user &&
      configuredSuperAdminEmail === email &&
      configuredSuperAdminPassword &&
      configuredSuperAdminPassword.length >= 8
    ) {
      const passwordHash = await bcrypt.hash(configuredSuperAdminPassword, 12)

      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: "Super",
          lastName: "Administrateur",
          role: "SUPER_ADMIN",
          organizationId: null,
          mustChangePassword: false,
          isActive: true,
        },
        select: {
          id: true,
          passwordHash: true,
          role: true,
          organizationId: true,
          isActive: true,
        },
      })
    }

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      )
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)

    if (!validPassword) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      )
    }

    await createSession({
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 },
    )
  }
}
