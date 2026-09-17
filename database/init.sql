-- ============================================================
-- PRESENCE-FLOW — Initialisation PostgreSQL / Neon
-- ============================================================
--
-- Utilisation :
-- 1. Ouvrir Neon > SQL Editor
-- 2. Copier-coller TOUT ce fichier
-- 3. Exécuter une seule fois sur une base vide
--
-- Le compte Super Administrateur initial est créé automatiquement.
-- Son mot de passe est généré aléatoirement par PostgreSQL et son
-- hash bcrypt est enregistré dans la base.
--
-- IMPORTANT : après exécution, le résultat de la dernière requête
-- SELECT affiche le mot de passe initial. Notez-le puis changez-le
-- depuis l'application après votre première connexion.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrganizationType') THEN
    CREATE TYPE "OrganizationType" AS ENUM (
      'COMPANY',
      'SCHOOL',
      'HOSPITAL',
      'ADMINISTRATION',
      'OTHER'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM (
      'SUPER_ADMIN',
      'ADMIN',
      'USER'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceStatus') THEN
    CREATE TYPE "AttendanceStatus" AS ENUM (
      'PRESENT',
      'LATE',
      'ABSENT'
    );
  END IF;
END
$$;

-- ------------------------------------------------------------
-- ORGANISATIONS
-- ------------------------------------------------------------

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
  "timezone" TEXT NOT NULL DEFAULT 'Africa/Douala',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------
-- DEPARTEMENTS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "Department" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Department_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- UTILISATEURS
-- ------------------------------------------------------------

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
  CONSTRAINT "User_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT "User_departmentId_fkey"
    FOREIGN KEY ("departmentId")
    REFERENCES "Department"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- PRESENCES
-- ------------------------------------------------------------

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
  CONSTRAINT "Attendance_userId_attendanceDate_key" UNIQUE ("userId", "attendanceDate"),
  CONSTRAINT "Attendance_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "Organization"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT "Attendance_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- ------------------------------------------------------------
-- INDEX
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "Organization_type_idx"
  ON "Organization"("type");

CREATE INDEX IF NOT EXISTS "Department_organizationId_idx"
  ON "Department"("organizationId");

CREATE UNIQUE INDEX IF NOT EXISTS "Department_organizationId_name_key"
  ON "Department"("organizationId", "name");

CREATE INDEX IF NOT EXISTS "User_organizationId_idx"
  ON "User"("organizationId");

CREATE INDEX IF NOT EXISTS "User_departmentId_idx"
  ON "User"("departmentId");

CREATE INDEX IF NOT EXISTS "Attendance_organizationId_attendanceDate_idx"
  ON "Attendance"("organizationId", "attendanceDate");

CREATE INDEX IF NOT EXISTS "Attendance_userId_attendanceDate_idx"
  ON "Attendance"("userId", "attendanceDate");

-- ------------------------------------------------------------
-- SUPER ADMINISTRATEUR INITIAL
-- ------------------------------------------------------------
--
-- Le mot de passe est généré dans Neon avec 18 octets aléatoires
-- encodés en hexadécimal, puis transformé en hash bcrypt.
-- Le mot de passe en clair n'est jamais enregistré dans le dépôt.
-- ------------------------------------------------------------

WITH candidate AS (
  SELECT encode(gen_random_bytes(18), 'hex') AS initial_password
), inserted AS (
  INSERT INTO "User" (
    "id",
    "organizationId",
    "email",
    "passwordHash",
    "firstName",
    "lastName",
    "role",
    "isActive",
    "mustChangePassword"
  )
  SELECT
    'super-admin-initial',
    NULL,
    'admin@presence-flow.cm',
    crypt(candidate.initial_password, gen_salt('bf', 12)),
    'Super',
    'Administrateur',
    'SUPER_ADMIN',
    TRUE,
    TRUE
  FROM candidate
  ON CONFLICT ("email") DO NOTHING
  RETURNING "email"
)
SELECT
  CASE
    WHEN inserted."email" IS NOT NULL THEN 'COMPTE SUPER ADMIN CRÉÉ — utilisez le mot de passe affiché puis changez-le.'
    ELSE 'LE COMPTE SUPER ADMIN EXISTE DÉJÀ — aucun nouveau mot de passe n’a été généré pour ce compte.'
  END AS "resultat",
  CASE
    WHEN inserted."email" IS NOT NULL THEN candidate.initial_password
    ELSE NULL
  END AS "mot_de_passe_initial"
FROM candidate
LEFT JOIN inserted ON TRUE;

-- ============================================================
-- FIN DE L'INITIALISATION
-- ============================================================
