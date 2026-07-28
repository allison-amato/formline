"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { GOAL_SCHEME, DAY_TEMPLATES, MUSCLE_KEYS, MUSCLE_LABELS, STATUS_TAGCLASS, normalizeDraftDays, weekMultFor, type DraftDay } from "@/lib/constants";
import { extractYoutubeId } from "@/lib/youtube";
import { t, type Lang } from "@/lib/i18n-strings";

const STATUS_KEYS = Object.keys(STATUS_TAGCLASS);
const GOAL_KEYS = Object.keys(GOAL_SCHEME);

export async function updateClientDetails(
  clientId: string,
  input: { name: string; goal: string; target: string }
): Promise<{ ok: true } | { ok: false; errorCode: "missing_name" }> {
  const name = input.name.trim();
  if (!name) return { ok: false, errorCode: "missing_name" };

  await prisma.client.update({
    where: { id: clientId },
    data: { name, goal: input.goal, target: input.target },
  });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/goal`);
  revalidatePath("/clients");
  return { ok: true };
}

export async function createClient(input: {
  name: string;
  goal: string;
  week: number;
  status: string;
}): Promise<
  | { ok: true; client: { id: string; name: string; goal: string; week: number; status: string } }
  | { ok: false; errorCode: "missing_fields" }
> {
  const name = input.name.trim();
  const week = Math.max(1, Math.round(input.week) || 1);

  if (!name || !GOAL_KEYS.includes(input.goal) || !STATUS_KEYS.includes(input.status)) {
    return { ok: false, errorCode: "missing_fields" };
  }

  const client = await prisma.client.create({
    data: {
      name,
      goal: input.goal,
      target: "",
      week,
      status: input.status,
      likedIds: "[]",
    },
  });

  revalidatePath("/clients");
  return {
    ok: true,
    client: { id: client.id, name: client.name, goal: client.goal, week: client.week, status: client.status },
  };
}

export async function deleteClient(clientId: string) {
  await prisma.client.delete({ where: { id: clientId } });
  revalidatePath("/clients");
}

export async function recordPlanSent(clientId: string): Promise<{ ok: true; planSentAt: Date }> {
  const planSentAt = new Date();
  await prisma.client.update({ where: { id: clientId }, data: { planSentAt } });
  revalidatePath(`/clients/${clientId}`);
  return { ok: true, planSentAt };
}

export async function autoSuggestDraft(clientId: string, lang: Lang): Promise<DraftDay[]> {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  const scheme = GOAL_SCHEME[client.goal] ?? GOAL_SCHEME.general;
  const weekMult = weekMultFor(client.week);
  const exercises = await prisma.exercise.findMany();
  const byId = Object.fromEntries(exercises.map((e) => [e.id, e]));

  const days: DraftDay[] = DAY_TEMPLATES.map((ids, i) => ({
    label: t(lang, "builder.dayLabel", { n: i + 1 }),
    rows: ids.map((id) => {
      const ex = byId[id];
      return {
        exerciseId: id,
        sets: scheme.sets,
        reps: scheme.reps,
        weight: ex.baseWeight == null ? null : Math.round(ex.baseWeight * scheme.mult * weekMult),
      };
    }),
    warmupIds: [],
    warmupRounds: 4,
  }));

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
  return normalizeDraftDays(JSON.parse(previous.days));
}

export async function advanceWeek(clientId: string): Promise<{ week: number; status: string }> {
  const current = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  // Advancing to a new week is a deliberate "we're moving forward" checkpoint,
  // so it's the natural moment to clear a needs-attention flag (unlike
  // plan-due, needs-attention is usually judgment-based, e.g. pain or slow
  // progress, so it shouldn't auto-clear on something as passive as a save).
  const status = current.status === "needs-attention" ? "on-track" : current.status;

  const client = await prisma.client.update({
    where: { id: clientId },
    data: { week: { increment: 1 }, status },
  });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return { week: client.week, status: client.status };
}

export async function savePlan(clientId: string, days: DraftDay[]): Promise<{ status: string }> {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  await prisma.planWeek.upsert({
    where: { clientId_week: { clientId, week: client.week } },
    create: { clientId, week: client.week, days: JSON.stringify(days) },
    update: { days: JSON.stringify(days) },
  });

  const status = client.status === "plan-due" ? "on-track" : client.status;
  if (status !== client.status) {
    await prisma.client.update({ where: { id: clientId }, data: { status } });
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return { status };
}

export async function updateClientStatus(
  clientId: string,
  status: string
): Promise<{ ok: true; status: string } | { ok: false; errorCode: "invalid_status" }> {
  if (!STATUS_KEYS.includes(status)) {
    return { ok: false, errorCode: "invalid_status" };
  }
  const client = await prisma.client.update({ where: { id: clientId }, data: { status } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return { ok: true, status: client.status };
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

export async function updateExercise(
  exerciseId: string,
  input: { nameEn: string; nameEs: string; videoUrl: string }
): Promise<
  | { ok: true; exercise: { nameEn: string; nameEs: string; videoUrl: string | null } }
  | { ok: false; errorCode: "missing_fields" | "invalid_url" }
> {
  const nameEn = input.nameEn.trim();
  const nameEs = input.nameEs.trim();
  if (!nameEn || !nameEs) return { ok: false, errorCode: "missing_fields" };

  const rawUrl = input.videoUrl.trim();
  let videoUrl: string | null = null;
  if (rawUrl) {
    if (!extractYoutubeId(rawUrl)) return { ok: false, errorCode: "invalid_url" };
    videoUrl = rawUrl;
  }

  const exercise = await prisma.exercise.update({
    where: { id: exerciseId },
    data: { nameEn, nameEs, videoUrl },
  });
  revalidatePath("/library");
  return { ok: true, exercise: { nameEn: exercise.nameEn, nameEs: exercise.nameEs, videoUrl: exercise.videoUrl } };
}

async function googleTranslate(
  text: string,
  target: "en" | "es"
): Promise<{ translated: string; detectedSourceLanguage: string } | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey || !text.trim()) return null;

  try {
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, target, format: "text" }),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const translation = data?.data?.translations?.[0];
    if (!translation || typeof translation.translatedText !== "string") return null;
    return {
      translated: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage ?? "en",
    };
  } catch {
    return null;
  }
}

export async function createExercise(input: {
  name: string;
  muscle: string;
  videoUrl: string;
}): Promise<
  | {
      ok: true;
      exercise: { id: string; nameEn: string; nameEs: string; muscle: string; videoUrl: string | null };
    }
  | { ok: false; errorCode: "missing_fields" | "invalid_url" }
> {
  const name = input.name.trim();

  if (!name || !MUSCLE_KEYS.includes(input.muscle)) {
    return { ok: false, errorCode: "missing_fields" };
  }

  const rawUrl = input.videoUrl.trim();
  let videoUrl: string | null = null;
  if (rawUrl) {
    if (!extractYoutubeId(rawUrl)) return { ok: false, errorCode: "invalid_url" };
    videoUrl = rawUrl;
  }

  // The trainer types the name in whichever language is convenient; detect
  // which one and machine-translate to fill the other. If the translation
  // API is unavailable, fall back to storing the same text in both columns
  // rather than blocking exercise creation.
  let nameEn = name;
  let nameEs = name;
  const guess = await googleTranslate(name, "es");
  if (guess) {
    if (guess.detectedSourceLanguage === "es") {
      nameEs = name;
      const reverse = await googleTranslate(name, "en");
      nameEn = reverse ? reverse.translated : name;
    } else {
      nameEn = name;
      nameEs = guess.translated;
    }
  }

  // muscleEs mirrors the primary (pre-"·") term from MUSCLE_LABELS, matching
  // the convention already used by the seed data (e.g. "glutes" -> "Glúteos").
  const muscleEs = MUSCLE_LABELS.es[input.muscle].split(" · ")[0];

  const exercise = await prisma.exercise.create({
    data: {
      id: randomUUID(),
      nameEn,
      nameEs,
      muscle: input.muscle,
      muscleEs,
      difficulty: "intermediate",
      reps: 10,
      videoUrl,
    },
  });

  revalidatePath("/library");
  return {
    ok: true,
    exercise: {
      id: exercise.id,
      nameEn: exercise.nameEn,
      nameEs: exercise.nameEs,
      muscle: exercise.muscle,
      videoUrl: exercise.videoUrl,
    },
  };
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
