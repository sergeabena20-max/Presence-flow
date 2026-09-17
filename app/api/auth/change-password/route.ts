import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSession, createSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : ""

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Les nouveaux mots de passe ne correspondent pas." }, { status: 400 })
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "Le nouveau mot de passe doit être différent de l’ancien." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, passwordHash: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Compte introuvable ou désactivé." }, { status: 401 })
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!validPassword) {
      return NextResponse.json({ error: "L’ancien mot de passe est incorrect." }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    })

    await createSession({
      userId: session.userId,
      role: session.role,
      organizationId: session.organizationId,
      mustChangePassword: false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Impossible de modifier le mot de passe." }, { status: 500 })
  }
}
