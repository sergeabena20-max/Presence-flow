import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) }
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.role)) {
    return { error: NextResponse.json({ error: "Accès interdit." }, { status: 403 }) }
  }
  if (session.role === "ADMIN" && !session.organizationId) {
    return { error: NextResponse.json({ error: "Organisation introuvable." }, { status: 403 }) }
  }
  return { session }
}

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const users = await prisma.user.findMany({
    where: { ...(auth.session.role === "ADMIN" ? { organizationId: auth.session.organizationId! } : {}), role: "USER" },
    select: {
      id: true, email: true, firstName: true, lastName: true, phone: true,
      matricule: true, role: true, functionTitle: true, isActive: true,
      departmentId: true, department: { select: { name: true } },
    },
    orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
  })

  return NextResponse.json({ users })
}

export async function POST() {
  return NextResponse.json(
    { error: "Les utilisateurs créent eux-mêmes leur compte depuis la page d’inscription." },
    { status: 403 },
  )
}
