import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

const TYPES = ["COMPANY", "SCHOOL", "HOSPITAL", "ADMINISTRATION", "OTHER"] as const

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const organizationName = typeof body.organizationName === "string" ? body.organizationName.trim() : ""
    const organizationType = typeof body.organizationType === "string" ? body.organizationType : ""
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : ""
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : ""
    const matricule = typeof body.matricule === "string" ? body.matricule.trim() : ""
    const functionTitle = typeof body.functionTitle === "string" ? body.functionTitle.trim() : ""
    const className = typeof body.className === "string" ? body.className.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!organizationName || !organizationType || !firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Organisation, type, prénom, nom, e-mail et mot de passe sont obligatoires." }, { status: 400 })
    }
    if (!(TYPES as readonly string[]).includes(organizationType)) {
      return NextResponse.json({ error: "Type d’organisation invalide." }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 })
    }
    if (organizationType === "SCHOOL" && (!className || !matricule)) {
      return NextResponse.json({ error: "Pour une école, la classe et le matricule sont obligatoires." }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    const existingRequest = await prisma.registrationRequest.findUnique({ where: { email }, select: { id: true, status: true } })
    if (existingUser) return NextResponse.json({ error: "Cette adresse e-mail est déjà utilisée." }, { status: 409 })
    if (existingRequest?.status === "PENDING") return NextResponse.json({ error: "Une demande d’inscription est déjà en attente pour cette adresse." }, { status: 409 })

    const passwordHash = await bcrypt.hash(password, 12)
    const requestRecord = await prisma.registrationRequest.upsert({
      where: { email },
      update: {
        organizationName,
        organizationType: organizationType as (typeof TYPES)[number],
        firstName, lastName, phone: phone || null, matricule: matricule || null,
        functionTitle: functionTitle || null, className: className || null,
        passwordHash, status: "PENDING", reviewedAt: null, reviewedByUserId: null,
      },
      create: {
        organizationName,
        organizationType: organizationType as (typeof TYPES)[number],
        firstName, lastName, email, phone: phone || null, matricule: matricule || null,
        functionTitle: functionTitle || null, className: className || null, passwordHash,
      },
      select: { id: true, email: true },
    })

    return NextResponse.json({ success: true, requestId: requestRecord.id }, { status: 201 })
  } catch (error) {
    console.error("Registration request error:", error)
    return NextResponse.json({ error: "Impossible d’enregistrer votre demande pour le moment." }, { status: 500 })
  }
}
