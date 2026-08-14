import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { SETTINGS_ID } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (existingSuperAdmin) {
    console.log("✅ Super Admin already exists. Skipping creation.");
  } else {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!superAdminEmail || !superAdminPassword) {
      throw new Error(
        "❌ SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in environment variables"
      );
    }

    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await prisma.user.create({
      data: {
        firstName: "Super",
        lastName: "Administrator",
        email: superAdminEmail,
        matricule: "SUPER_ADMIN_001",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log("✅ Super Admin created successfully");
    console.log(`   Email: ${superAdmin.email}`);
  }

  // Un seul enregistrement Settings, avec un id fixe et connu (voir
  // src/lib/constants.ts) — partagé avec src/actions/settings.ts.
  const existingSettings = await prisma.settings.findUnique({
    where: { id: SETTINGS_ID },
  });

  if (!existingSettings) {
    const defaultSettings = await prisma.settings.create({
      data: {
        id: SETTINGS_ID,
        facilityName: "Default Organization",
        address: "123 Main Street, City, Country",
        latitude: 0,
        longitude: 0,
        gpsRadius: 100,
        officialArrivalTime: new Date("1970-01-01T09:00:00"),
        arrivalTolerance: 15,
        officialDepartureTime: new Date("1970-01-01T17:00:00"),
      },
    });

    console.log("✅ Default settings created successfully");
    console.log(`   Facility Name: ${defaultSettings.facilityName}`);
    console.log("   ⚠️  Latitude/Longitude à 0,0 — va sur /settings pour les configurer.");
  } else {
    console.log("✅ Settings already exist. Skipping creation.");
  }

  console.log("\n🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
