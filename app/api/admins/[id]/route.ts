import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function authorize(id: string) {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) }
  if (session.role !== "ADMIN" || !session.organizationId) return { error: NextResponse.json({ error: "Accès interdit." }, { status: 403 }) }

  const admin = await prisma.user.findFirst({
    where: { id, organizationId: session.organizationId, role: "ADMIN" },
    select: { id: true, isActive: true },
  })
  if (!admin) return { error: NextResponse.json({ error: "Administrateur introuvable." }, { status: 404 }) }
  return { session, admin }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await authorize(id)
  if ("error" in auth) return auth.error

  try {
    const body = await request.json()
    const data: { firstName?: string; lastName?: string; phone?: string | null; passwordHash?: string; isActive?: boolean } = {}

    if (typeof body.firstName === "string") data.firstName = body.firstName.trim()
    if (typeof body.lastName === "string") data.lastName = body.lastName.trim()
    if (typeof body.phone === "string") data.phone = body.phone.trim() || null
    if (typeof body.isActive === "boolean") data.isActive = body.isActive

    if (typeof body.password === "string" && body.password.length > 0) {
      if (body.password.length < 8) return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 })
      data.passwordHash = await bcrypt.hash(body.password, 12)
    }

    if (data.firstName === "" || data.lastName === "") return NextResponse.json({ error: "Le prénom et le nom sont obligatoires." }, { status: 400 })

    if (auth.admin.id === auth.session.userId && data.isActive === false) {
      return NextResponse.json({ error: "Vous ne pouvez pas désactiver votre propre compte administrateur." }, { status: 400 })
    }

    const admin = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, isActive: true, createdAt: true },
    })
    return NextResponse.json({ success: true, admin })
  } catch (error) {
    console.error("Admin update error:", error)
    return NextResponse.json({ error: "Impossible de modifier l’administrateur." }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await authorize(id)
  if ("error" in auth) return auth.error

  if (id === auth.session.userId) return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte administrateur." }, { status: 400 })

  const activeAdminCount = await prisma.user.count({ where: { organizationId: auth.session.organizationId, role: "ADMIN", isActive: true } })
  if (auth.admin.isActive && activeAdminCount <= 1) return NextResponse.json({ error: "Impossible de supprimer le dernier administrateur actif de l’organisation." }, { status: 409 })

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
