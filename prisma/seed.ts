import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (existingSuperAdmin) {
    console.log("✅ Super Admin already exists. Skipping creation.");
    return;
  }

  // Get super admin credentials from environment variables
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    throw new Error(
      "❌ SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in environment variables"
    );
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

  // Create super admin user
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
  console.log(`   ID: ${superAdmin.id}`);

  // Create default settings for the facility
  const existingSettings = await prisma.settings.findFirst();

  if (!existingSettings) {
    const defaultSettings = await prisma.settings.create({
      data: {
        facilityName: "Default Organization",
        address: "123 Main Street, City, Country",
        latitude: 0,
        longitude: 0,
        gpsRadius: 100, // 100 meters
        officialArrivalTime: new Date("2024-01-01T09:00:00"),
        arrivalTolerance: 15, // 15 minutes
        officialDepartureTime: new Date("2024-01-01T17:00:00"),
      },
    });

    console.log("✅ Default settings created successfully");
    console.log(`   Facility Name: ${defaultSettings.facilityName}`);
    console.log(`   GPS Radius: ${defaultSettings.gpsRadius}m`);
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
