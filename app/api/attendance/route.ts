import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { calculateDistanceMeters, isValidCoordinate } from "@/lib/geolocation"

function getDoualaDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Douala", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function getTodayDate() {
  return new Date(`${getDoualaDateKey()}T00:00:00.000Z`)
}

function getCurrentMinutes() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Douala", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return Number(values.hour) * 60 + Number(values.minute)
}

function timeToMinutes(value: string) {
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  if (session.role !== "USER" || !session.organizationId) return NextResponse.json({ error: "Seul un utilisateur d’une organisation peut pointer une présence." }, { status: 403 })

  try {
    const body = await request.json()
    const latitude = Number(body.latitude)
    const longitude = Number(body.longitude)
    const accuracy = body.accuracy == null ? null : Number(body.accuracy)
    if (!isValidCoordinate(latitude, longitude)) return NextResponse.json({ error: "Position GPS invalide." }, { status: 400 })

    const organization = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { id: true, latitude: true, longitude: true, allowedRadiusM: true, workStartTime: true, checkInToleranceMinutes: true, workEndTime: true },
    })
    if (!organization || organization.latitude == null || organization.longitude == null) return NextResponse.json({ error: "La position de votre organisation n’est pas encore configurée." }, { status: 409 })

    const distance = calculateDistanceMeters(latitude, longitude, organization.latitude, organization.longitude)
    if (distance > organization.allowedRadiusM) return NextResponse.json({ error: `Pointage refusé : vous êtes à ${Math.round(distance)} m du lieu autorisé (rayon : ${organization.allowedRadiusM} m).`, distanceM: Math.round(distance), allowedRadiusM: organization.allowedRadiusM }, { status: 403 })

    const user = await prisma.user.findFirst({ where: { id: session.userId, organizationId: session.organizationId, role: "USER", isActive: true }, select: { id: true } })
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable ou compte désactivé." }, { status: 404 })

    const now = new Date()
    const today = getTodayDate()
    const currentMinutes = getCurrentMinutes()
    const startMinutes = timeToMinutes(organization.workStartTime)
    const endMinutes = timeToMinutes(organization.workEndTime)
    const checkInDeadline = startMinutes + organization.checkInToleranceMinutes

    const existing = await prisma.attendance.findUnique({ where: { userId_attendanceDate: { userId: user.id, attendanceDate: today } } })

    if (!existing || !existing.checkInAt) {
      if (existing?.checkOutAt) return NextResponse.json({ error: "Votre départ a déjà été enregistré pour aujourd’hui. L’arrivée ne peut plus être ajoutée." }, { status: 409 })

      // Après la fin de journée, l’arrivée est fermée mais le départ reste possible.
      // Si aucun pointage d’arrivée n’existe, on conserve explicitement l’absence.
      if (currentMinutes >= endMinutes) {
        const attendance = existing
          ? await prisma.attendance.update({
              where: { id: existing.id },
              data: {
                status: "ABSENT",
                checkOutAt: now,
                checkOutLat: latitude,
                checkOutLng: longitude,
                checkOutDistanceM: distance,
                checkOutAccuracyM: Number.isFinite(accuracy) ? accuracy : null,
                verification: "GPS_RADIUS",
              },
            })
          : await prisma.attendance.create({
              data: {
                organizationId: organization.id,
                userId: user.id,
                attendanceDate: today,
                status: "ABSENT",
                checkOutAt: now,
                checkOutLat: latitude,
                checkOutLng: longitude,
                checkOutDistanceM: distance,
                checkOutAccuracyM: Number.isFinite(accuracy) ? accuracy : null,
                verification: "GPS_RADIUS",
              },
            })

        return NextResponse.json({
          success: true,
          action: "CHECK_OUT",
          message: "Départ enregistré. Aucun pointage d’arrivée n’a été enregistré aujourd’hui.",
          attendance: { id: attendance.id, distanceM: Math.round(distance), status: "ABSENT" },
        }, { status: existing ? 200 : 201 })
      }

      if (currentMinutes > checkInDeadline) return NextResponse.json({ error: `Le délai de pointage d’arrivée est dépassé. L’arrivée était possible jusqu’à ${organization.workStartTime} + ${organization.checkInToleranceMinutes} min. Le départ reste disponible à partir de ${organization.workEndTime}.` }, { status: 403 })

      const status = currentMinutes > startMinutes ? "LATE" : "PRESENT"
      const attendance = existing
        ? await prisma.attendance.update({ where: { id: existing.id }, data: { checkInAt: now, status, checkInLat: latitude, checkInLng: longitude, checkInDistanceM: distance, checkInAccuracyM: Number.isFinite(accuracy) ? accuracy : null, verification: "GPS_RADIUS" } })
        : await prisma.attendance.create({ data: { organizationId: organization.id, userId: user.id, attendanceDate: today, checkInAt: now, status, checkInLat: latitude, checkInLng: longitude, checkInDistanceM: distance, checkInAccuracyM: Number.isFinite(accuracy) ? accuracy : null, verification: "GPS_RADIUS" } })

      return NextResponse.json({ success: true, action: "CHECK_IN", message: status === "LATE" ? "Arrivée enregistrée avec retard." : "Arrivée enregistrée avec succès.", attendance: { id: attendance.id, distanceM: Math.round(distance), status } }, { status: existing ? 200 : 201 })
    }

    if (existing.checkOutAt) return NextResponse.json({ error: "Votre départ est déjà enregistré. Aucun second pointage n’est possible aujourd’hui." }, { status: 409 })
    if (currentMinutes < endMinutes) return NextResponse.json({ error: `Le départ sera disponible à partir de ${organization.workEndTime}.` }, { status: 403 })

    const attendance = await prisma.attendance.update({ where: { id: existing.id }, data: { checkOutAt: now, checkOutLat: latitude, checkOutLng: longitude, checkOutDistanceM: distance, checkOutAccuracyM: Number.isFinite(accuracy) ? accuracy : null, verification: "GPS_RADIUS" } })
    return NextResponse.json({ success: true, action: "CHECK_OUT", message: "Départ enregistré avec succès.", attendance: { id: attendance.id, distanceM: Math.round(distance) } })
  } catch (error) {
    console.error("Attendance error:", error)
    return NextResponse.json({ error: "Impossible d’enregistrer la présence." }, { status: 500 })
  }
}
