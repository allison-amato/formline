-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "week" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'on-track',
    "likedIds" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planSentAt" TIMESTAMP(3),

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameEs" TEXT NOT NULL,
    "muscle" TEXT NOT NULL,
    "muscleEs" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "baseWeight" DOUBLE PRECISION,
    "reps" INTEGER NOT NULL,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "videoUrl" TEXT,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanWeek" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "days" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanWeek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanWeek_clientId_week_key" ON "PlanWeek"("clientId", "week");

-- AddForeignKey
ALTER TABLE "PlanWeek" ADD CONSTRAINT "PlanWeek_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
