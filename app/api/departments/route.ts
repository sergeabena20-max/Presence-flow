import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  if (session.role !== "ADMIN" || !session.organizationId) return NextResponse.json({ error: "Accès interdit." }, { status: 403 })

  const departments = await prisma.department.findMany({
    where: { organizationId: session.organizationId },
    select: { id: true, name: true, _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json({ departments })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  if (session.role !== "ADMIN" || !session.organizationId) return NextResponse.json({ error: "Accès interdit." }, { status: 403 })

  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) return NextResponse.json({ error: "Le nom du département est obligatoire." }, { status: 400 })

    const existing = await prisma.department.findFirst({ where: { organizationId: session.organizationId, name: { equals: name, mode: "insensitive" } }, select: { id: true } })
    if (existing) return NextResponse.json({ error: "Ce département existe déjà." }, { status: 409 })

    const department = await prisma.department.create({ data: { organizationId: session.organizationId, name }, select: { id: true, name: true } })
    return NextResponse.json({ success: true, department }, { status: 201 })
  } catch (error) {
    console.error("Department creation error:", error)
    return NextResponse.json({ error: "Impossible de créer le département." }, { status: 500 })
  }
}
