DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RegistrationStatus') THEN
    CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING','APPROVED','REJECTED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "RegistrationRequest" (
  "id" TEXT NOT NULL,
  "organizationName" TEXT NOT NULL,
  "organizationType" "OrganizationType" NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "matricule" TEXT,
  "functionTitle" TEXT,
  "className" TEXT,
  "passwordHash" TEXT NOT NULL,
  "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedAt" TIMESTAMP(3),
  "reviewedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RegistrationRequest_email_key" UNIQUE ("email")
);
CREATE INDEX IF NOT EXISTS "RegistrationRequest_status_idx" ON "RegistrationRequest"("status");
CREATE INDEX IF NOT EXISTS "RegistrationRequest_organizationName_organizationType_status_idx" ON "RegistrationRequest"("organizationName","organizationType","status");
