import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) }
  if (session.role !== "ADMIN" || !session.organizationId) return { error: NextResponse.json({ error: "Accès interdit." }, { status: 403 }) }
  return { session }
}

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error
  const admins = await prisma.user.findMany({
    where: { organizationId: auth.session.organizationId, role: "ADMIN" },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, isActive: true, createdAt: true },
    orderBy: [{ isActive: "desc" }, { lastName: "asc" }],
  })
  return NextResponse.json({ admins })
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
    const password = typeof body.password === "string" ? body.password : ""
    if (!firstName || !lastName || !email || !password) return NextResponse.json({ error: "Prénom, nom, e-mail et mot de passe sont obligatoires." }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 })
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return NextResponse.json({ error: "Cette adresse e-mail est déjà utilisée." }, { status: 409 })
    const passwordHash = await bcrypt.hash(password, 12)
    const admin = await prisma.user.create({ data: { organizationId: auth.session.organizationId, firstName, lastName, email, phone: phone || null, passwordHash, role: "ADMIN", isActive: true }, select: { id: true, firstName: true, lastName: true, email: true, phone: true, isActive: true } })
    return NextResponse.json({ success: true, admin }, { status: 201 })
  } catch (error) {
    console.error("Admin creation error:", error)
    return NextResponse.json({ error: "Impossible de créer l’administrateur." }, { status: 500 })
  }
}
