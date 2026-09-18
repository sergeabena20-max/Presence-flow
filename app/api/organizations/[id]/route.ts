import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function authorize() {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) }
  if (session.role !== "SUPER_ADMIN") return { error: NextResponse.json({ error: "Accès interdit." }, { status: 403 }) }
  return { session }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize()
  if ("error" in auth) return auth.error
  try {
    const { id } = await params
    const organization = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true, name: true, type: true, phone: true, email: true, address: true, createdAt: true,
        users: { where: { role: { in: ["ADMIN", "USER"] } }, select: { id: true, role: true, firstName: true, lastName: true, email: true, phone: true, isActive: true, createdAt: true }, orderBy: [{ role: "asc" }, { lastName: "asc" }] },
        _count: { select: { attendances: true } },
      },
    })
    if (!organization) return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 })
    return NextResponse.json({ organization })
  } catch (error) {
    console.error("Organization details error:", error)
    return NextResponse.json({ error: "Impossible de charger l’organisation." }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize()
  if ("error" in auth) return auth.error
  try {
    const { id } = await params
    const organization = await prisma.organization.findUnique({ where: { id }, select: { id: true, name: true } })
    if (!organization) return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 })
    await prisma.organization.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Organization deletion error:", error)
    return NextResponse.json({ error: "Impossible de supprimer l’organisation." }, { status: 500 })
  }
}
