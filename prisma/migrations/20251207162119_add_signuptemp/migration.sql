-- CreateTable
CREATE TABLE "signup_temps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "signup_temps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "signup_temps_email_key" ON "signup_temps"("email");

-- CreateIndex
CREATE INDEX "signup_temps_email_idx" ON "signup_temps"("email");

-- CreateIndex
CREATE INDEX "signup_temps_phone_idx" ON "signup_temps"("phone");
