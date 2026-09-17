import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { calculateDistanceMeters, isValidCoordinate } from "@/lib/geolocation"

function getDoualaDayBounds() {
  const now = new Date()
  const doualaNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Douala" }))
  const start = new Date(doualaNow)
  start.setHours(0, 0, 0, 0)
  const end = new Date(doualaNow)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export async function POST(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }

  if (session.role === "SUPER_ADMIN" || !session.organizationId) {
    return NextResponse.json(
      { error: "Seul un utilisateur d’une organisation peut pointer une présence." },
      { status: 403 },
    )
  }

  try {
    const body = await request.json()
    const latitude = Number(body.latitude)
    const longitude = Number(body.longitude)
    const accuracy = body.accuracy == null ? null : Number(body.accuracy)

    if (!isValidCoordinate(latitude, longitude)) {
      return NextResponse.json({ error: "Position GPS invalide." }, { status: 400 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { id: true, latitude: true, longitude: true, allowedRadiusM: true },
    })

    if (!organization || organization.latitude == null || organization.longitude == null) {
      return NextResponse.json(
        { error: "La position de votre organisation n’est pas encore configurée." },
        { status: 409 },
      )
    }

    const distance = calculateDistanceMeters(
      latitude,
      longitude,
      organization.latitude,
      organization.longitude,
    )

    if (distance > organization.allowedRadiusM) {
      return NextResponse.json(
        {
          error: `Pointage refusé : vous êtes à ${Math.round(distance)} m du lieu autorisé (rayon : ${organization.allowedRadiusM} m).`,
          distanceM: Math.round(distance),
          allowedRadiusM: organization.allowedRadiusM,
        },
        { status: 403 },
      )
    }

    const user = await prisma.user.findFirst({
      where: { id: session.userId, organizationId: session.organizationId, isActive: true },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 })
    }

    const { start, end } = getDoualaDayBounds()
    const existing = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        organizationId: organization.id,
        attendanceDate: { gte: start, lte: end },
      },
    })

    const now = new Date()

    if (!existing) {
      const attendance = await prisma.attendance.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          attendanceDate: start,
          checkInAt: now,
          status: "PRESENT",
          checkInLat: latitude,
          checkInLng: longitude,
          checkInDistanceM: distance,
          checkInAccuracyM: Number.isFinite(accuracy) ? accuracy : null,
          verification: "GPS_RADIUS",
        },
      })

      return NextResponse.json({
        success: true,
        action: "CHECK_IN",
        message: "Arrivée enregistrée avec succès.",
        attendance: { id: attendance.id, distanceM: Math.round(distance) },
      }, { status: 201 })
    }

    if (existing.checkOutAt) {
      return NextResponse.json({ error: "Votre présence du jour est déjà clôturée." }, { status: 409 })
    }

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
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
      message: "Départ enregistré avec succès.",
      attendance: { id: attendance.id, distanceM: Math.round(distance) },
    })
  } catch (error) {
    console.error("Attendance error:", error)
    return NextResponse.json({ error: "Impossible d’enregistrer la présence." }, { status: 500 })
  }
}
