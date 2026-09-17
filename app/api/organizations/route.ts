import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ORGANIZATION_TYPES = [
  "COMPANY",
  "SCHOOL",
  "HOSPITAL",
  "ADMINISTRATION",
  "OTHER",
] as const

export async function POST(request: Request) {
  const session = await getSession()

  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  if (session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Accès interdit." }, { status: 403 })

  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const type = typeof body.type === "string" ? body.type : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const address = typeof body.address === "string" ? body.address.trim() : ""
    const adminFirstName = typeof body.adminFirstName === "string" ? body.adminFirstName.trim() : ""
    const adminLastName = typeof body.adminLastName === "string" ? body.adminLastName.trim() : ""
    const adminEmail = typeof body.adminEmail === "string" ? body.adminEmail.trim().toLowerCase() : ""
    const adminPhone = typeof body.adminPhone === "string" ? body.adminPhone.trim() : ""
    const adminPassword = typeof body.adminPassword === "string" ? body.adminPassword : ""

    if (!name || !type || !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: "Veuillez remplir tous les champs obligatoires." }, { status: 400 })
    }

    if (!(ORGANIZATION_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json({ error: "Type d’organisation invalide." }, { status: 400 })
    }

    if (adminPassword.length < 8) {
      return NextResponse.json({ error: "Le mot de passe de l’administrateur doit contenir au moins 8 caractères." }, { status: 400 })
    }

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } })
    if (existingAdmin) {
      return NextResponse.json({ error: "Cette adresse e-mail administrateur est déjà utilisée." }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12)

    const organization = await prisma.$transaction(async (tx) => {
      const createdOrganization = await tx.organization.create({
        data: {
          name,
          type: type as (typeof ORGANIZATION_TYPES)[number],
          phone: phone || null,
          email: email || null,
          address: address || null,
          allowedRadiusM: 100,
          timezone: "Africa/Douala",
        },
      })

      await tx.user.create({
        data: {
          organizationId: createdOrganization.id,
          email: adminEmail,
          passwordHash,
          firstName: adminFirstName,
          lastName: adminLastName,
          phone: adminPhone || null,
          role: "ADMIN",
          isActive: true,
          mustChangePassword: true,
        },
      })

      return createdOrganization
    })

    return NextResponse.json({ success: true, organization: { id: organization.id, name: organization.name } }, { status: 201 })
  } catch (error) {
    console.error("Organization creation error:", error)
    return NextResponse.json({ error: "Impossible de créer l’organisation pour le moment." }, { status: 500 })
  }
}
