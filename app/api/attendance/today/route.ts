import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

function getDoualaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Douala", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  const url = new URL(request.url)
  const requestedOrganizationId = url.searchParams.get("organizationId")?.trim()
  if (session.role === "USER" && !session.organizationId) return NextResponse.json({ error: "Organisation requise." }, { status: 403 })
  if (session.role === "ADMIN" && !session.organizationId) return NextResponse.json({ error: "Organisation requise." }, { status: 403 })
  if (session.role === "USER" && requestedOrganizationId && requestedOrganizationId !== session.organizationId) return NextResponse.json({ error: "Accès interdit." }, { status: 403 })
  if (session.role === "ADMIN" && requestedOrganizationId && requestedOrganizationId !== session.organizationId) return NextResponse.json({ error: "Accès interdit." }, { status: 403 })

  const organizationId = session.role === "SUPER_ADMIN" ? requestedOrganizationId || undefined : session.organizationId!
  const requestedDate = url.searchParams.get("date")?.trim() || getDoualaDateKey()
  const dateAllowed = /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
  const attendanceDateKey = session.role === "USER" ? getDoualaDateKey() : (dateAllowed ? requestedDate : getDoualaDateKey())
  const attendanceDate = new Date(`${attendanceDateKey}T00:00:00.000Z`)

  try {
    const attendances = await prisma.attendance.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        attendanceDate,
        ...(session.role === "USER" ? { userId: session.userId } : {}),
      },
      select: {
        id: true, status: true, checkInAt: true, checkOutAt: true, checkInDistanceM: true, checkOutDistanceM: true,
        checkInAccuracyM: true, checkOutAccuracyM: true, verification: true,
        organization: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, matricule: true, functionTitle: true, department: { select: { name: true } } } },
      },
      orderBy: { checkInAt: "desc" },
      take: session.role === "USER" ? 1 : 500,
    })
    const organizations = session.role === "SUPER_ADMIN"
      ? await prisma.organization.findMany({ select: { id: true, name: true, type: true }, orderBy: { name: "asc" } })
      : []
    return NextResponse.json({ date: attendanceDateKey, attendances, organizations, role: session.role })
  } catch (error) {
    console.error("Today attendance error:", error)
    return NextResponse.json({ error: "Impossible de charger les présences." }, { status: 500 })
  }
}
