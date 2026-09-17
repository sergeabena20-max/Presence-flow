import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_RADII = [50, 100, 150, 200, 300, 500, 1000]
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

async function requireAdmin() {
  const session = await getSession()
  if (!session) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) }
  if (session.role !== "ADMIN" || !session.organizationId) return { error: NextResponse.json({ error: "Accès interdit." }, { status: 403 }) }
  return { session }
}

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error
  const organization = await prisma.organization.findUnique({
    where: { id: auth.session.organizationId },
    select: { id: true, name: true, latitude: true, longitude: true, allowedRadiusM: true, workStartTime: true, checkInToleranceMinutes: true, workEndTime: true, timezone: true },
  })
  if (!organization) return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 })
  return NextResponse.json({ organization })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  try {
    const body = await request.json()
    const latitude = Number(body.latitude)
    const longitude = Number(body.longitude)
    const allowedRadiusM = Number(body.allowedRadiusM)
    const workStartTime = typeof body.workStartTime === "string" ? body.workStartTime : ""
    const workEndTime = typeof body.workEndTime === "string" ? body.workEndTime : ""
    const checkInToleranceMinutes = Number(body.checkInToleranceMinutes)

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return NextResponse.json({ error: "Latitude invalide." }, { status: 400 })
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return NextResponse.json({ error: "Longitude invalide." }, { status: 400 })
    if (!ALLOWED_RADII.includes(allowedRadiusM)) return NextResponse.json({ error: "Rayon autorisé invalide." }, { status: 400 })
    if (!TIME_PATTERN.test(workStartTime) || !TIME_PATTERN.test(workEndTime)) return NextResponse.json({ error: "Heure de début ou de fin invalide." }, { status: 400 })
    if (!Number.isInteger(checkInToleranceMinutes) || checkInToleranceMinutes < 0 || checkInToleranceMinutes > 180) return NextResponse.json({ error: "Délai de tolérance invalide (0 à 180 minutes)." }, { status: 400 })

    const startMinutes = Number(workStartTime.slice(0, 2)) * 60 + Number(workStartTime.slice(3, 5))
    const endMinutes = Number(workEndTime.slice(0, 2)) * 60 + Number(workEndTime.slice(3, 5))
    if (endMinutes <= startMinutes) return NextResponse.json({ error: "L’heure de fin doit être après l’heure de début." }, { status: 400 })

    const organization = await prisma.organization.update({
      where: { id: auth.session.organizationId },
      data: { latitude, longitude, allowedRadiusM, workStartTime, workEndTime, checkInToleranceMinutes },
      select: { id: true, name: true, latitude: true, longitude: true, allowedRadiusM: true, workStartTime: true, checkInToleranceMinutes: true, workEndTime: true, timezone: true },
    })
    return NextResponse.json({ success: true, organization })
  } catch (error) {
    console.error("Organization settings error:", error)
    return NextResponse.json({ error: "Impossible d'enregistrer les paramètres." }, { status: 500 })
  }
}
