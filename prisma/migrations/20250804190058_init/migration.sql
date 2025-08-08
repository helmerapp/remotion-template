-- CreateTable
CREATE TABLE "public"."Renders" (
    "uuid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "output_location" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Renders_uuid_key" ON "public"."Renders"("uuid");
