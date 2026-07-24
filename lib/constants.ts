import type { Lang } from "@/lib/i18n";

export const MUSCLE_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    glutes: "Glutes · hamstrings",
    hamstrings: "Hamstrings · arms",
    quads: "Quads · glutes",
    chest: "Chest · core",
    back: "Back",
    shoulders: "Shoulders",
    core: "Core",
  },
  es: {
    glutes: "Glúteos · isquiotibiales",
    hamstrings: "Isquiotibiales · brazos",
    quads: "Cuádriceps · glúteos",
    chest: "Pecho · core",
    back: "Espalda",
    shoulders: "Hombros",
    core: "Core",
  },
};

export const MUSCLE_KEYS = Object.keys(MUSCLE_LABELS.en);

export const WEEK_MULT: Record<number, number> = { 1: 0.85, 2: 0.9, 3: 1, 4: 0.8 };

// Training weeks cycle through the same 4-week progression (build, build,
// peak, deload) rather than the app only ever supporting weeks 1-4.
export function weekMultFor(week: number): number {
  const cyclePos = ((week - 1) % 4) + 1;
  return WEEK_MULT[cyclePos];
}

export const GOAL_SCHEME: Record<string, { reps: number; sets: number; mult: number }> = {
  general: { reps: 10, sets: 4, mult: 1 },
  muscle: { reps: 8, sets: 4, mult: 1.15 },
  loss: { reps: 15, sets: 3, mult: 0.7 },
  pain: { reps: 12, sets: 2, mult: 0.5 },
};

export const STATUS_TAGCLASS: Record<string, string> = {
  "on-track": "tag-neutral",
  "plan-due": "tag-accent",
  "needs-attention": "tag-outline",
};

export const DAY_TEMPLATES: string[][] = [
  ["e1", "e2", "e3", "e4", "e5", "e6"],
  ["e7", "e8", "e9", "e10", "e11", "e12"],
  ["e13", "e14", "e15", "e16", "e17", "e18"],
];

export const DAY_LABELS: Record<Lang, string[]> = {
  en: ["Day 1", "Day 2", "Day 3"],
  es: ["Día 1", "Día 2", "Día 3"],
};

export type DraftRow = {
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number | null;
  notes?: string;
  // Cached Spanish machine-translation of `notes`, plus the exact English
  // text it was translated from (so an edit invalidates the cache).
  notesEs?: string;
  notesTranslatedFrom?: string;
};
export type DraftDay = DraftRow[];
