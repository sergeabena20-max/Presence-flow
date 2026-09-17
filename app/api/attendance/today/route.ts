import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

function getDoualaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Douala", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  if (!session.organizationId) return NextResponse.json({ error: "Organisation requise." }, { status: 403 })

  const attendanceDate = new Date(`${getDoualaDateKey()}T00:00:00.000Z`)

  try {
    const attendances = await prisma.attendance.findMany({
      where: {
        organizationId: session.organizationId,
        attendanceDate,
        ...(session.role === "USER" ? { userId: session.userId } : {}),
      },
      select: {
        id: true,
        status: true,
        checkInAt: true,
        checkOutAt: true,
        checkInDistanceM: true,
        checkOutDistanceM: true,
        checkInAccuracyM: true,
        checkOutAccuracyM: true,
        verification: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            matricule: true,
            functionTitle: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { checkInAt: "desc" },
      take: session.role === "USER" ? 1 : 100,
    })

    return NextResponse.json({ date: getDoualaDateKey(), attendances })
  } catch (error) {
    console.error("Today attendance error:", error)
    return NextResponse.json({ error: "Impossible de charger les présences." }, { status: 500 })
  }
}
