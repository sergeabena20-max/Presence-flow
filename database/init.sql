-- ============================================================
-- PRESENCE-FLOW — Initialisation PostgreSQL / Neon
-- ============================================================
-- Ce fichier initialise uniquement la structure de la base.
-- Le SUPER_ADMIN est créé par l'application à la première
-- connexion avec SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrganizationType') THEN
    CREATE TYPE "OrganizationType" AS ENUM ('COMPANY','SCHOOL','HOSPITAL','ADMINISTRATION','OTHER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN','ADMIN','USER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceStatus') THEN
    CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT','LATE','ABSENT');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "OrganizationType" NOT NULL,
  "logoUrl" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "allowedRadiusM" INTEGER NOT NULL DEFAULT 100,
  "workStartTime" TEXT NOT NULL DEFAULT '08:00',
  "checkInToleranceMinutes" INTEGER NOT NULL DEFAULT 30,
  "workEndTime" TEXT NOT NULL DEFAULT '17:00',
  "timezone" TEXT NOT NULL DEFAULT 'Africa/Douala',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "workStartTime" TEXT NOT NULL DEFAULT '08:00';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "checkInToleranceMinutes" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "workEndTime" TEXT NOT NULL DEFAULT '17:00';

CREATE TABLE IF NOT EXISTS "Department" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT,
  "matricule" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "functionTitle" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT FALSE,
  "departmentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_email_key" UNIQUE ("email"),
  CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Attendance" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "attendanceDate" DATE NOT NULL,
  "checkInAt" TIMESTAMP(3),
  "checkOutAt" TIMESTAMP(3),
  "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
  "checkInLat" DOUBLE PRECISION,
  "checkInLng" DOUBLE PRECISION,
  "checkInDistanceM" DOUBLE PRECISION,
  "checkInAccuracyM" DOUBLE PRECISION,
  "checkOutLat" DOUBLE PRECISION,
  "checkOutLng" DOUBLE PRECISION,
  "checkOutDistanceM" DOUBLE PRECISION,
  "checkOutAccuracyM" DOUBLE PRECISION,
  "verification" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Attendance_userId_attendanceDate_key" UNIQUE ("userId","attendanceDate"),
  CONSTRAINT "Attendance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Organization_type_idx" ON "Organization"("type");
CREATE INDEX IF NOT EXISTS "Department_organizationId_idx" ON "Department"("organizationId");
CREATE UNIQUE INDEX IF NOT EXISTS "Department_organizationId_name_key" ON "Department"("organizationId","name");
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX IF NOT EXISTS "User_departmentId_idx" ON "User"("departmentId");
CREATE INDEX IF NOT EXISTS "Attendance_organizationId_attendanceDate_idx" ON "Attendance"("organizationId","attendanceDate");
CREATE INDEX IF NOT EXISTS "Attendance_userId_attendanceDate_idx" ON "Attendance"("userId","attendanceDate");
