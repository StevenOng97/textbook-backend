-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "magic_link_expires_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "bookings_magic_link_expires_at_idx" ON "bookings"("magic_link_expires_at");
