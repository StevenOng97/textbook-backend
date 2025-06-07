-- CreateEnum
CREATE TYPE "appointment_type" AS ENUM ('CONSULTATION', 'TUTORIAL', 'ASSESSMENT', 'GROUP_SESSION', 'WORKSHOP');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "booking_id" VARCHAR(255) NOT NULL,
    "magic_link_id" VARCHAR(50) NOT NULL,
    "user_name" VARCHAR(255) NOT NULL,
    "user_phone" VARCHAR(50) NOT NULL,
    "appointment_type" "appointment_type" NOT NULL,
    "appointment_date" TIMESTAMPTZ(6) NOT NULL,
    "booking_details" JSONB NOT NULL DEFAULT '{}',
    "status" "booking_status" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "payment_status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "payment_id" VARCHAR(255),
    "payment_amount" DECIMAL(10,2),
    "payment_currency" VARCHAR(3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMPTZ(6),
    "payment_updated_at" TIMESTAMPTZ(6),
    "last_accessed_at" TIMESTAMPTZ(6),
    "access_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_analytics" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "user_agent" TEXT,
    "ip_address" INET,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_id_key" ON "bookings"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_magic_link_id_key" ON "bookings"("magic_link_id");

-- CreateIndex
CREATE INDEX "bookings_booking_id_idx" ON "bookings"("booking_id");

-- CreateIndex
CREATE INDEX "bookings_magic_link_id_idx" ON "bookings"("magic_link_id");

-- CreateIndex
CREATE INDEX "bookings_user_phone_idx" ON "bookings"("user_phone");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_payment_status_idx" ON "bookings"("payment_status");

-- CreateIndex
CREATE INDEX "bookings_appointment_date_idx" ON "bookings"("appointment_date");

-- CreateIndex
CREATE INDEX "bookings_created_at_idx" ON "bookings"("created_at");

-- CreateIndex
CREATE INDEX "booking_analytics_booking_id_idx" ON "booking_analytics"("booking_id");

-- CreateIndex
CREATE INDEX "booking_analytics_event_type_idx" ON "booking_analytics"("event_type");

-- CreateIndex
CREATE INDEX "booking_analytics_timestamp_idx" ON "booking_analytics"("timestamp");

-- AddForeignKey
ALTER TABLE "booking_analytics" ADD CONSTRAINT "booking_analytics_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
