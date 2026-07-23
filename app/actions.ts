"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { GOAL_SCHEME, DAY_TEMPLATES, weekMultFor, type DraftDay } from "@/lib/constants";
import { extractYoutubeId } from "@/lib/youtube";

export async function saveGoal(clientId: string, goal: string, target: string) {
  await prisma.client.update({ where: { id: clientId }, data: { goal, target } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/goal`);
  revalidatePath("/clients");
}

export async function autoSuggestDraft(clientId: string): Promise<DraftDay[]> {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  const scheme = GOAL_SCHEME[client.goal] ?? GOAL_SCHEME.general;
  const weekMult = weekMultFor(client.week);
  const exercises = await prisma.exercise.findMany();
  const byId = Object.fromEntries(exercises.map((e) => [e.id, e]));

  const days: DraftDay[] = DAY_TEMPLATES.map((ids) =>
    ids.map((id) => {
      const ex = byId[id];
      return {
        exerciseId: id,
        sets: scheme.sets,
        reps: scheme.reps,
        weight: ex.baseWeight == null ? null : Math.round(ex.baseWeight * scheme.mult * weekMult),
      };
    })
  );

  await prisma.planWeek.upsert({
    where: { clientId_week: { clientId, week: client.week } },
    create: { clientId, week: client.week, days: JSON.stringify(days) },
    update: { days: JSON.stringify(days) },
  });

  revalidatePath(`/clients/${clientId}`);
  return days;
}

export async function duplicatePreviousWeek(clientId: string): Promise<DraftDay[] | null> {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  const previous = await prisma.planWeek.findUnique({
    where: { clientId_week: { clientId, week: client.week - 1 } },
  });
  if (!previous) return null;

  await prisma.planWeek.upsert({
    where: { clientId_week: { clientId, week: client.week } },
    create: { clientId, week: client.week, days: previous.days },
    update: { days: previous.days },
  });

  revalidatePath(`/clients/${clientId}`);
  return JSON.parse(previous.days);
}

export async function advanceWeek(clientId: string): Promise<number> {
  const client = await prisma.client.update({
    where: { id: clientId },
    data: { week: { increment: 1 } },
  });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return client.week;
}

export async function savePlan(clientId: string, days: DraftDay[]) {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  await prisma.planWeek.upsert({
    where: { clientId_week: { clientId, week: client.week } },
    create: { clientId, week: client.week, days: JSON.stringify(days) },
    update: { days: JSON.stringify(days) },
  });
  revalidatePath(`/clients/${clientId}`);
}

export async function incrementExerciseUse(exerciseId: string) {
  await prisma.exercise.update({
    where: { id: exerciseId },
    data: { useCount: { increment: 1 } },
  });
}

export async function updateExerciseVideo(
  exerciseId: string,
  rawUrl: string
): Promise<{ ok: true; videoUrl: string | null } | { ok: false; errorCode: "invalid_url" }> {
  const trimmed = rawUrl.trim();

  if (trimmed === "") {
    await prisma.exercise.update({ where: { id: exerciseId }, data: { videoUrl: null } });
    revalidatePath("/library");
    return { ok: true, videoUrl: null };
  }

  const videoId = extractYoutubeId(trimmed);
  if (!videoId) {
    return { ok: false, errorCode: "invalid_url" };
  }

  await prisma.exercise.update({ where: { id: exerciseId }, data: { videoUrl: trimmed } });
  revalidatePath("/library");
  return { ok: true, videoUrl: trimmed };
}

export async function translateNote(text: string): Promise<{ ok: true; translated: string } | { ok: false }> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey || !text.trim()) return { ok: false };

  try {
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: "en", target: "es", format: "text" }),
    });
    if (!res.ok) return { ok: false };

    const data = await res.json();
    const translated = data?.data?.translations?.[0]?.translatedText;
    if (typeof translated !== "string") return { ok: false };
    return { ok: true, translated };
  } catch {
    return { ok: false };
  }
}
