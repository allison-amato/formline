import prisma from "@/lib/prisma";
import Shell from "@/components/Shell";
import ExerciseLibraryEditor from "@/components/ExerciseLibraryEditor";

export default async function LibraryPage() {
  const exercises = await prisma.exercise.findMany({ orderBy: { nameEn: "asc" } });

  return (
    <Shell active="library">
      <ExerciseLibraryEditor
        exercises={exercises.map((e) => ({
          id: e.id,
          nameEn: e.nameEn,
          nameEs: e.nameEs,
          muscle: e.muscle,
          videoUrl: e.videoUrl,
        }))}
      />
    </Shell>
  );
}
