import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function authorize(id: string) {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) }
  if (session.role !== "ADMIN" || !session.organizationId) {
    return { error: NextResponse.json({ error: "Accès interdit." }, { status: 403 }) }
  }
  const user = await prisma.user.findFirst({ where: { id, organizationId: session.organizationId } })
  if (!user) return { error: NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 }) }
  return { session, user }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await authorize(id)
  if ("error" in auth) return auth.error

  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}
    for (const key of ["firstName", "lastName", "phone", "matricule", "functionTitle"]) {
      if (body[key] !== undefined) data[key] = typeof body[key] === "string" ? body[key].trim() || null : null
    }
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)
    if (body.departmentId !== undefined) {
      const departmentId = typeof body.departmentId === "string" && body.departmentId.trim() ? body.departmentId.trim() : null
      if (departmentId) {
        const department = await prisma.department.findFirst({ where: { id: departmentId, organizationId: auth.session.organizationId! }, select: { id: true } })
        if (!department) return NextResponse.json({ error: "Département invalide." }, { status: 400 })
      }
      data.departmentId = departmentId
    }
    if (body.password) {
      if (typeof body.password !== "string" || body.password.length < 8) return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 })
      data.passwordHash = await bcrypt.hash(body.password, 12)
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, matricule: true, role: true, functionTitle: true, isActive: true, departmentId: true },
    })
    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error("User update error:", error)
    return NextResponse.json({ error: "Impossible de modifier le personnel." }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await authorize(id)
  if ("error" in auth) return auth.error

  if (auth.user.role !== "USER") {
    return NextResponse.json({ error: "Seuls les utilisateurs du personnel peuvent être supprimés ici." }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
