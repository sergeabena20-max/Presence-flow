import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getSession()
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Accès interdit." }, { status: 403 })
  }

  const requests = await prisma.registrationRequest.findMany({
    where: session.role === "ADMIN" && session.organizationId
      ? {
          status: "PENDING",
          organizationType: { in: ["COMPANY", "SCHOOL", "HOSPITAL", "ADMINISTRATION", "OTHER"] },
        }
      : { status: "PENDING" },
    select: {
      id: true, organizationName: true, organizationType: true, firstName: true, lastName: true,
      email: true, phone: true, matricule: true, functionTitle: true, className: true, createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })

  const filtered = session.role === "ADMIN" && session.organizationId
    ? await (async () => {
        const organization = await prisma.organization.findUnique({ where: { id: session.organizationId }, select: { name: true, type: true } })
        if (!organization) return []
        return requests.filter((item) => item.organizationName.trim().toLowerCase() === organization.name.trim().toLowerCase() && item.organizationType === organization.type)
      })()
    : requests

  const organizations = session.role === "SUPER_ADMIN"
    ? await prisma.organization.findMany({ select: { id: true, name: true, type: true }, orderBy: { name: "asc" } })
    : []

  return NextResponse.json({ requests: filtered, organizations, role: session.role })
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Accès interdit." }, { status: 403 })
  }

  try {
    const body = await request.json()
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : ""
    const action = body.action === "reject" ? "reject" : "approve"
    const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : ""

    if (!requestId) return NextResponse.json({ error: "Demande invalide." }, { status: 400 })

    const registration = await prisma.registrationRequest.findUnique({ where: { id: requestId } })
    if (!registration || registration.status !== "PENDING") {
      return NextResponse.json({ error: "Demande introuvable ou déjà traitée." }, { status: 404 })
    }

    if (action === "reject") {
      await prisma.registrationRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", reviewedAt: new Date(), reviewedByUserId: session.userId },
      })
      return NextResponse.json({ success: true })
    }

    let targetOrganizationId = organizationId
    if (session.role === "ADMIN") {
      if (!session.organizationId) return NextResponse.json({ error: "Organisation administrateur introuvable." }, { status: 403 })
      const organization = await prisma.organization.findUnique({ where: { id: session.organizationId }, select: { id: true, name: true, type: true } })
      if (!organization || organization.type !== registration.organizationType || organization.name.trim().toLowerCase() !== registration.organizationName.trim().toLowerCase()) {
        return NextResponse.json({ error: "Cette demande ne correspond pas à votre organisation. Vérifiez le nom et le type avant validation." }, { status: 403 })
      }
      targetOrganizationId = organization.id
    }

    if (!targetOrganizationId) return NextResponse.json({ error: "Sélectionnez une organisation." }, { status: 400 })

    const organization = await prisma.organization.findUnique({ where: { id: targetOrganizationId }, select: { id: true } })
    if (!organization) return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 })

    const existingUser = await prisma.user.findUnique({ where: { email: registration.email }, select: { id: true } })
    if (existingUser) return NextResponse.json({ error: "Un compte utilise déjà cette adresse e-mail." }, { status: 409 })

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          organizationId: targetOrganizationId,
          firstName: registration.firstName,
          lastName: registration.lastName,
          email: registration.email,
          passwordHash: registration.passwordHash,
          phone: registration.phone,
          matricule: registration.matricule,
          functionTitle: registration.functionTitle,
          role: "USER",
          isActive: true,
          mustChangePassword: false,
        },
        select: { id: true, firstName: true, lastName: true, email: true },
      })
      await tx.registrationRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED", reviewedAt: new Date(), reviewedByUserId: session.userId },
      })
      return user
    })

    return NextResponse.json({ success: true, user: created })
  } catch (error) {
    console.error("Registration review error:", error)
    return NextResponse.json({ error: "Impossible de traiter la demande." }, { status: 500 })
  }
}
