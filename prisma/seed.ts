import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbUrl = process.env["DATABASE_URL"] ?? "file:./prisma/dev.db";
const dbPath = dbUrl.replace("file:", "");
const resolvedPath = path.resolve(dbPath);

const adapter = new PrismaBetterSqlite3({ url: resolvedPath });
const prisma = new PrismaClient({ adapter });

// Bilingual names for nameEs sourced from a real client plan (trainer:
// Gaspar Córdoba); English names, muscle groups, difficulty, and base
// weights come from the FormLine Trainer design prototype.
const LIB = [
  { id: "e1", nameEn: "Single-leg deadlift", nameEs: "Peso muerto a 1 pierna", muscle: "glutes", muscleEs: "Glúteos", difficulty: "advanced", baseWeight: 20, reps: 8 },
  { id: "e2", nameEn: "Dumbbell press", nameEs: "Press con mancuernas", muscle: "shoulders", muscleEs: "Hombros", difficulty: "intermediate", baseWeight: 10, reps: 10 },
  { id: "e3", nameEn: "High plank dumbbell row", nameEs: "Remo con mancuerna en plancha alta", muscle: "back", muscleEs: "Espalda", difficulty: "intermediate", baseWeight: 8, reps: 10 },
  { id: "e4", nameEn: "Bulgarian squat", nameEs: "Sentadilla búlgara", muscle: "quads", muscleEs: "Cuádriceps", difficulty: "advanced", baseWeight: 14, reps: 10 },
  { id: "e5", nameEn: "Low pulley glute kick-off", nameEs: "Patada de glúteo en polea baja", muscle: "glutes", muscleEs: "Glúteos", difficulty: "beginner", baseWeight: 15, reps: 12 },
  { id: "e6", nameEn: "Sit + raise abs", nameEs: "Abdominales en vela + elevación", muscle: "core", muscleEs: "Core", difficulty: "beginner", baseWeight: null, reps: 15 },
  { id: "e7", nameEn: "Hip thrust", nameEs: "Empuje de cadera", muscle: "glutes", muscleEs: "Glúteos", difficulty: "intermediate", baseWeight: 30, reps: 10 },
  { id: "e8", nameEn: "Pull over on fitball", nameEs: "Pull over sobre fitball", muscle: "chest", muscleEs: "Pecho", difficulty: "intermediate", baseWeight: 8, reps: 12 },
  { id: "e9", nameEn: "Sumo squat with dumbbell", nameEs: "Sentadilla sumo con mancuerna", muscle: "quads", muscleEs: "Cuádriceps", difficulty: "intermediate", baseWeight: 16, reps: 10 },
  { id: "e10", nameEn: "Chest pulldown high pulley", nameEs: "Jalón al pecho polea alta", muscle: "back", muscleEs: "Espalda", difficulty: "beginner", baseWeight: 22, reps: 10 },
  { id: "e11", nameEn: "Smith lunge", nameEs: "Lunge en Smith", muscle: "quads", muscleEs: "Cuádriceps", difficulty: "intermediate", baseWeight: 16, reps: 10 },
  { id: "e12", nameEn: "High plank alternating", nameEs: "Plancha alta alternando", muscle: "core", muscleEs: "Core", difficulty: "beginner", baseWeight: null, reps: 15 },
  { id: "e13", nameEn: "Romanian lift + curl and press", nameEs: "Levantamiento rumano + curl y press a 1PP", muscle: "hamstrings", muscleEs: "Isquiotibiales", difficulty: "advanced", baseWeight: 12, reps: 8 },
  { id: "e14", nameEn: "Incline bench dumbbell fly", nameEs: "Apertura de mancuernas banco inclinado", muscle: "chest", muscleEs: "Pecho", difficulty: "intermediate", baseWeight: 8, reps: 12 },
  { id: "e15", nameEn: "Walking lunges", nameEs: "Estocadas caminando", muscle: "quads", muscleEs: "Cuádriceps", difficulty: "beginner", baseWeight: 10, reps: 10 },
  { id: "e16", nameEn: "TRX row", nameEs: "Remo en TRX", muscle: "back", muscleEs: "Espalda", difficulty: "intermediate", baseWeight: null, reps: 12 },
  { id: "e17", nameEn: "Spinals on bench", nameEs: "Espinales en banco", muscle: "back", muscleEs: "Espalda", difficulty: "beginner", baseWeight: null, reps: 15 },
  { id: "e18", nameEn: "Abdominals on fitball", nameEs: "Abdominales sobre fitball", muscle: "core", muscleEs: "Core", difficulty: "beginner", baseWeight: null, reps: 15 },
];

const ROSTER = [
  { id: "allie", name: "Allie", goal: "general", target: "Feel strong for ski season — Dec", week: 3, status: "on-track", likedIds: ["e7", "e15", "e16"] },
  { id: "marcus", name: "Marcus Chen", goal: "muscle", target: "Bench 90kg", week: 2, status: "on-track", likedIds: ["e1", "e4", "e13"] },
  { id: "priya", name: "Priya Nair", goal: "loss", target: "Lose 6kg by Nov", week: 4, status: "plan-due", likedIds: ["e6", "e12", "e18"] },
  { id: "diego", name: "Diego Fuentes", goal: "pain", target: "Pain-free squat", week: 1, status: "needs-attention", likedIds: ["e5", "e17"] },
  { id: "sam", name: "Sam O'Rourke", goal: "general", target: "Run a 10k", week: 3, status: "on-track", likedIds: ["e9", "e15"] },
  { id: "jade", name: "Jade Whitfield", goal: "muscle", target: "Add 3kg lean mass", week: 2, status: "needs-attention", likedIds: ["e2", "e14"] },
];

const DAY_TEMPLATES = [
  ["e1", "e2", "e3", "e4", "e5", "e6"],
  ["e7", "e8", "e9", "e10", "e11", "e12"],
  ["e13", "e14", "e15", "e16", "e17", "e18"],
];
const GOAL_SCHEME: Record<string, { reps: number; sets: number; mult: number }> = {
  general: { reps: 10, sets: 4, mult: 1 },
  muscle: { reps: 8, sets: 4, mult: 1.15 },
  loss: { reps: 15, sets: 3, mult: 0.7 },
  pain: { reps: 12, sets: 2, mult: 0.5 },
};
const WEEK_MULT: Record<number, number> = { 1: 0.85, 2: 0.9, 3: 1, 4: 0.8 };

async function main() {
  console.log("Seeding database...");

  await prisma.planWeek.deleteMany();
  await prisma.client.deleteMany();
  await prisma.exercise.deleteMany();

  const byId = Object.fromEntries(LIB.map((ex) => [ex.id, ex]));
  for (const ex of LIB) {
    await prisma.exercise.create({ data: ex });
  }

  for (const c of ROSTER) {
    await prisma.client.create({
      data: {
        id: c.id,
        name: c.name,
        goal: c.goal,
        target: c.target,
        week: c.week,
        status: c.status,
        likedIds: JSON.stringify(c.likedIds),
      },
    });
  }

  // Seed Allie's week-2 plan (her real trainer-adjusted numbers, week before
  // her current week 3) so "duplicate previous week" is demoable immediately.
  const allie = ROSTER.find((c) => c.id === "allie")!;
  const scheme = GOAL_SCHEME[allie.goal];
  const week2Mult = WEEK_MULT[2];
  const week2Days = DAY_TEMPLATES.map((ids) =>
    ids.map((id) => {
      const ex = byId[id];
      return {
        exerciseId: id,
        sets: scheme.sets,
        reps: scheme.reps,
        weight: ex.baseWeight == null ? null : Math.round(ex.baseWeight * scheme.mult * week2Mult),
      };
    })
  );
  await prisma.planWeek.create({
    data: { clientId: "allie", week: 2, days: JSON.stringify(week2Days) },
  });

  console.log(`Seeded ${LIB.length} exercises and ${ROSTER.length} clients.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
