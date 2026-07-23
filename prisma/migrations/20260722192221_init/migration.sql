-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "week" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'on-track',
    "likedIds" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameEn" TEXT NOT NULL,
    "nameEs" TEXT NOT NULL,
    "muscle" TEXT NOT NULL,
    "muscleEs" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "baseWeight" REAL,
    "reps" INTEGER NOT NULL,
    "useCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "PlanWeek" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "days" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlanWeek_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanWeek_clientId_week_key" ON "PlanWeek"("clientId", "week");
