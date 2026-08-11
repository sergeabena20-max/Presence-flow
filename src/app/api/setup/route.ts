import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.SUPER_ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, message: "Non autorisé" }, { status: 401 });
  }

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (existingSuperAdmin) {
    return NextResponse.json({ success: true, message: "Super Admin déjà existant" });
  }

  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD manquants" },
      { status: 500 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      firstName: "Super",
      lastName: "Administrator",
      email,
      matricule: "SUPER_ADMIN_001",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  const existingSettings = await prisma.settings.findFirst();
  if (!existingSettings) {
    await prisma.settings.create({
      data: {
        facilityName: "Default Organization",
        address: "123 Main Street",
        latitude: 0,
        longitude: 0,
        gpsRadius: 100,
        officialArrivalTime: new Date("2024-01-01T09:00:00"),
        arrivalTolerance: 15,
        officialDepartureTime: new Date("2024-01-01T17:00:00"),
      },
    });
  }

  return NextResponse.json({ success: true, message: "Super Admin créé avec succès" });
}
