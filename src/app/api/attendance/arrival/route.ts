import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/gps";
import { requireUser, toApiError } from "@/lib/permissions";
import { SignArrivalInput } from "@/lib/types";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function combineDateAndTime(date: Date, timeOfDay: Date) {
  const combined = new Date(date);
  combined.setHours(
    timeOfDay.getHours(),
    timeOfDay.getMinutes(),
    timeOfDay.getSeconds(),
    0
  );
  return combined;
}

// POST /api/attendance/arrival — "Signer mon arrivée"
// Signe toujours pour l'utilisateur authentifié courant. Impossible de
// signer pour quelqu'un d'autre, quel que soit l'id envoyé.
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    if (user.role !== "EMPLOYEE" && user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Seuls les employés et étudiants peuvent signer une présence" },
        { status: 403 }
      );
    }

    const body: SignArrivalInput = await request.json();

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

    const now = new Date();
    const today = startOfDay(now);

    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    });

    if (existing?.arrivalTime) {
      return NextResponse.json(
        { success: false, message: "Vous avez déjà signé votre arrivée aujourd'hui" },
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

    const officialArrival = combineDateAndTime(now, settings.officialArrivalTime);
    const deadline = new Date(officialArrival.getTime() + settings.arrivalTolerance * 60_000);
    const status = now.getTime() <= deadline.getTime() ? "PRESENT" : "LATE";

    const attendance = await prisma.attendance.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      create: {
        userId: user.id,
        date: today,
        arrivalTime: now,
        arrivalLat: body.latitude,
        arrivalLon: body.longitude,
        arrivalDistance: distance,
        arrivalStatus: status,
      },
      update: {
        arrivalTime: now,
        arrivalLat: body.latitude,
        arrivalLon: body.longitude,
        arrivalDistance: distance,
        arrivalStatus: status,
      },
    });

    return NextResponse.json(
      { success: true, message: "Arrivée enregistrée avec succès", data: attendance },
      { status: 201 }
    );
  } catch (error) {
    const { status, body } = toApiError(error);
    return NextResponse.json(body, { status });
  }
}
