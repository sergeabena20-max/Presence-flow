import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) }
  if (session.role !== "ADMIN" || !session.organizationId) {
    return { error: NextResponse.json({ error: "Accès interdit." }, { status: 403 }) }
  }
  return { session }
}

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const users = await prisma.user.findMany({
    where: { organizationId: auth.session.organizationId },
    select: {
      id: true, email: true, firstName: true, lastName: true, phone: true,
      matricule: true, role: true, functionTitle: true, isActive: true,
      departmentId: true, department: { select: { name: true } },
    },
    orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
  })

  return NextResponse.json({ users })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  try {
    const body = await request.json()
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : ""
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : ""
    const matricule = typeof body.matricule === "string" ? body.matricule.trim() : ""
    const functionTitle = typeof body.functionTitle === "string" ? body.functionTitle.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const departmentId = typeof body.departmentId === "string" && body.departmentId ? body.departmentId : null

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Nom, prénom, e-mail et mot de passe sont obligatoires." }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) return NextResponse.json({ error: "Cette adresse e-mail est déjà utilisée." }, { status: 409 })

    if (departmentId) {
      const department = await prisma.department.findFirst({ where: { id: departmentId, organizationId: auth.session.organizationId }, select: { id: true } })
      if (!department) return NextResponse.json({ error: "Département invalide." }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        organizationId: auth.session.organizationId,
        firstName, lastName, email, passwordHash,
        phone: phone || null, matricule: matricule || null,
        functionTitle: functionTitle || null, departmentId,
        role: "USER", isActive: true,
      },
      select: { id: true, firstName: true, lastName: true, email: true },
    })

    return NextResponse.json({ success: true, user }, { status: 201 })
  } catch (error) {
    console.error("User creation error:", error)
    return NextResponse.json({ error: "Impossible de créer le personnel." }, { status: 500 })
  }
}
