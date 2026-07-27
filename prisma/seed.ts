import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
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

// Only seeds the starter exercise library. Deliberately does not touch
// clients or plan weeks — this runs against the real database, so it must
// stay safe to re-run without ever wiping a trainer's actual data.
async function main() {
  console.log("Seeding exercise library...");

  for (const ex of LIB) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      create: ex,
      update: ex,
    });
  }

  console.log(`Seeded ${LIB.length} exercises.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
