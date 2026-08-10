import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/gps";
import { requireUser, toApiError } from "@/lib/permissions";
import { SignDepartureInput } from "@/lib/types";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// POST /api/attendance/departure — "Signer mon départ"
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    if (user.role !== "EMPLOYEE" && user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Seuls les employés et étudiants peuvent signer une présence" },
        { status: 403 }
      );
    }

    const body: SignDepartureInput = await request.json();

    if (
      typeof body.latitude !== "number" ||
      typeof body.longitude !== "number" ||
      Number.isNaN(body.latitude) ||
      Number.isNaN(body.longitude)
    ) {
      return NextResponse.json(
        { success: false, message: "Position GPS invalide ou indisponible" },
        { status: 400 }
      );
    }

    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return NextResponse.json(
        { success: false, message: "Les paramètres de l'établissement ne sont pas configurés" },
        { status: 500 }
      );
    }

    const today = startOfDay(new Date());

    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    });

    if (!existing || !existing.arrivalTime) {
      return NextResponse.json(
        { success: false, message: "Vous devez signer votre arrivée avant votre départ" },
        { status: 409 }
      );
    }

    if (existing.departureTime) {
      return NextResponse.json(
        { success: false, message: "Vous avez déjà signé votre départ aujourd'hui" },
        { status: 409 }
      );
    }

    const distance = calculateDistance(
      body.latitude,
      body.longitude,
      settings.latitude,
      settings.longitude
    );

    if (distance > settings.gpsRadius) {
      return NextResponse.json(
        { success: false, message: "Vous êtes hors de la zone autorisée." },
        { status: 403 }
      );
    }

    const attendance = await prisma.attendance.update({
      where: { userId_date: { userId: user.id, date: today } },
      data: {
        departureTime: new Date(),
        departureLat: body.latitude,
        departureLon: body.longitude,
        departureDistance: distance,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Départ enregistré avec succès",
      data: attendance,
    });
  } catch (error) {
    const { status, body } = toApiError(error);
    return NextResponse.json(body, { status });
  }
}
