import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true, type: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json({ organizations })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : ""
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : ""
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : ""
    const matricule = typeof body.matricule === "string" ? body.matricule.trim() : ""
    const functionTitle = typeof body.functionTitle === "string" ? body.functionTitle.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!organizationId || !firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Organisation, prénom, nom, e-mail et mot de passe sont obligatoires." }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 })
    }

    const organization = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } })
    if (!organization) {
      return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 })
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      return NextResponse.json({ error: "Cette adresse e-mail est déjà utilisée." }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        organizationId,
        firstName,
        lastName,
        email,
        passwordHash,
        phone: phone || null,
        matricule: matricule || null,
        functionTitle: functionTitle || null,
        role: "USER",
        isActive: true,
        mustChangePassword: false,
      },
      select: { id: true, firstName: true, lastName: true, email: true },
    })

    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Impossible de créer votre compte." }, { status: 500 })
  }
}
