import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_RADII = [50, 100, 150, 200, 300, 500, 1000]

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }

  if (session.role !== "ADMIN" || !session.organizationId) {
    return NextResponse.json({ error: "Accès interdit." }, { status: 403 })
  }

  const organization = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      allowedRadiusM: true,
      timezone: true,
    },
  })

  if (!organization) {
    return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 })
  }

  return NextResponse.json({ organization })
}

export async function PATCH(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 })
  }

  if (session.role !== "ADMIN" || !session.organizationId) {
    return NextResponse.json({ error: "Accès interdit." }, { status: 403 })
  }

  try {
    const body = await request.json()
    const latitude = Number(body.latitude)
    const longitude = Number(body.longitude)
    const allowedRadiusM = Number(body.allowedRadiusM)

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return NextResponse.json({ error: "Latitude invalide." }, { status: 400 })
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: "Longitude invalide." }, { status: 400 })
    }

    if (!ALLOWED_RADII.includes(allowedRadiusM)) {
      return NextResponse.json(
        { error: "Rayon autorisé invalide." },
        { status: 400 },
      )
    }

    const organization = await prisma.organization.update({
      where: { id: session.organizationId },
      data: {
        latitude,
        longitude,
        allowedRadiusM,
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        allowedRadiusM: true,
        timezone: true,
      },
    })

    return NextResponse.json({ success: true, organization })
  } catch (error) {
    console.error("Organization settings error:", error)
    return NextResponse.json(
      { error: "Impossible d'enregistrer les paramètres." },
      { status: 500 },
    )
  }
}
