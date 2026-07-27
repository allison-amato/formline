"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "es";

const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    "nav.subtitle": "Trainer console — Coach Gasper",
    "nav.clients": "Clients",
    "nav.library": "Exercise library",

    "roster.heading": "Clients",
    "roster.activeThisWeek": "{n} active this week",
    "roster.statActive": "Active clients",
    "roster.statPlansDue": "Plans due",
    "roster.statAttention": "Needs attention",
    "roster.searchPlaceholder": "Search clients…",
    "roster.colClient": "Client",
    "roster.colGoal": "Goal",
    "roster.colWeek": "Week",
    "roster.colStatus": "Status",
    "roster.weekValue": "Week {n}",
    "roster.addClient": "+ Add client",
    "roster.addClientTitle": "Add a new client",
    "roster.nameLabel": "Client name",
    "roster.namePlaceholder": "e.g. Jordan Lee",
    "roster.weekLabel": "Starting week",
    "roster.statusLabel": "Status",
    "roster.create": "Add client",
    "roster.remove": "Remove",
    "roster.removeConfirm": "Remove {name} and all of their saved plans? This can't be undone.",
    "roster.errorMissingFields": "Enter a name, goal, and status.",

    "builder.back": "← Clients",
    "builder.export": "Export to Excel",
    "builder.startWeek": "Start Week {n} →",
    "builder.editGoal": "Edit details",
    "builder.targetLine": "{goal} · target: {target} · Week {week}",
    "builder.planSentOn": "Plan sent on {date}",
    "builder.changeStatus": "Click to change status",
    "builder.preferenceHistory": "Preference history",
    "builder.copyDayTo": "Copy {day} to…",
    "builder.applyExercisesTo": "Apply {day}'s exercises to:",
    "builder.apply": "Apply",
    "builder.cancel": "Cancel",
    "builder.colDay": "Day",
    "builder.colExercise": "Exercise",
    "builder.colMuscle": "Muscle",
    "builder.colSets": "Sets",
    "builder.colReps": "Reps",
    "builder.colWeight": "Weight",
    "builder.colNotes": "Notes",
    "builder.preferred": "preferred",
    "builder.notesPlaceholder": "Notes",
    "builder.swap": "Swap",
    "builder.addExercise": "+ Add exercise",
    "builder.savePlan": "Save plan",
    "builder.planSaved": "Plan saved.",
    "builder.noDraftYet": "No draft yet for week {n}.",
    "builder.buildFrom": "Build one from {name}'s goal and liked exercises.",
    "builder.duplicatePreviousWeek": "Duplicate previous week",
    "builder.autoSuggest": "Auto-suggest draft plan",
    "builder.swapExerciseTitle": "Swap exercise",
    "builder.addExerciseTitle": "Add exercise",
    "builder.searchExercises": "Search exercises…",
    "builder.muscleAll": "All",
    "builder.recentlyUsed": "Recently used",
    "builder.allExercises": "All exercises",
    "builder.weightUnitBW": "BW",
    "builder.weightUnitKg": "kg",

    "goal.heading": "{name}'s details",
    "goal.subheading": "Edit their name and the goal that shapes their plan.",
    "goal.nameLabel": "Client name",
    "goal.errorMissingName": "Enter a name.",
    "goal.primaryGoal": "Primary goal",
    "goal.targetLabel": "Target",
    "goal.targetPlaceholder": "e.g. squat 60kg by October",
    "goal.save": "Save details",
    "goal.saved": "Saved.",

    "library.heading": "Exercise library",
    "library.count": "{n} exercises · attach a YouTube demo link to any exercise",
    "library.noVideo": "No video",
    "library.urlPlaceholder": "https://www.youtube.com/watch?v=…",
    "library.save": "Save",
    "library.saved": "Saved.",
    "library.addExercise": "+ Add exercise",
    "library.addExerciseTitle": "Add a new exercise",
    "library.nameLabel": "Exercise name",
    "library.namePlaceholder": "e.g. Barbell squat / Sentadilla con barra",
    "library.nameHelp": "Type it in English or Spanish — the other language is filled in automatically.",
    "library.muscleLabel": "Muscle group",
    "library.videoLabelOptional": "Video link (optional)",
    "library.create": "Add to library",
    "library.edit": "Edit",
    "library.editExerciseTitle": "Edit exercise",
    "library.nameEnLabel": "Name (English)",
    "library.nameEsLabel": "Name (Spanish)",
    "library.saveChanges": "Save changes",
    "library.errorMissingFields": "Enter a name and pick a muscle group.",

    "export.name": "NAME",
    "export.trainer": "TRAINER",
    "export.objective": "OBJECTIVE",
    "export.observations": "OBSERVATIONS",
    "export.week": "WEEK",
    "export.warmup": "WARM-UP (X4)",
    "export.trainerName": "Gasper",
    "library.errorInvalidUrl": "That doesn't look like a YouTube link (watch/youtu.be/shorts/embed).",

    "notes.autoTranslated": "(machine-translated)",
    "notes.translationUnavailable": "(translation unavailable — showing original)",
    "notes.translating": "Translating…",

    "goal.general": "General fitness",
    "goal.muscle": "Muscle growth",
    "goal.loss": "Weight loss",
    "goal.pain": "Pain management",

    "status.on-track": "On track",
    "status.plan-due": "Plan due",
    "status.needs-attention": "Needs attention",
  },
  es: {
    "nav.subtitle": "Consola del entrenador — Coach Gasper",
    "nav.clients": "Clientes",
    "nav.library": "Biblioteca de ejercicios",

    "roster.heading": "Clientes",
    "roster.activeThisWeek": "{n} activos esta semana",
    "roster.statActive": "Clientes activos",
    "roster.statPlansDue": "Planes pendientes",
    "roster.statAttention": "Necesitan atención",
    "roster.searchPlaceholder": "Buscar clientes…",
    "roster.colClient": "Cliente",
    "roster.colGoal": "Objetivo",
    "roster.colWeek": "Semana",
    "roster.colStatus": "Estado",
    "roster.weekValue": "Semana {n}",
    "roster.addClient": "+ Agregar cliente",
    "roster.addClientTitle": "Agregar un nuevo cliente",
    "roster.nameLabel": "Nombre del cliente",
    "roster.namePlaceholder": "ej. Jordan Lee",
    "roster.weekLabel": "Semana inicial",
    "roster.statusLabel": "Estado",
    "roster.create": "Agregar cliente",
    "roster.remove": "Eliminar",
    "roster.removeConfirm": "¿Eliminar a {name} y todos sus planes guardados? Esta acción no se puede deshacer.",
    "roster.errorMissingFields": "Ingresa un nombre, objetivo y estado.",

    "builder.back": "← Clientes",
    "builder.export": "Exportar a Excel",
    "builder.startWeek": "Comenzar semana {n} →",
    "builder.editGoal": "Editar detalles",
    "builder.targetLine": "{goal} · objetivo: {target} · Semana {week}",
    "builder.planSentOn": "Plan enviado el {date}",
    "builder.changeStatus": "Haz clic para cambiar el estado",
    "builder.preferenceHistory": "Historial de preferencias",
    "builder.copyDayTo": "Copiar {day} a…",
    "builder.applyExercisesTo": "Aplicar los ejercicios de {day} a:",
    "builder.apply": "Aplicar",
    "builder.cancel": "Cancelar",
    "builder.colDay": "Día",
    "builder.colExercise": "Ejercicio",
    "builder.colMuscle": "Músculo",
    "builder.colSets": "Series",
    "builder.colReps": "Repeticiones",
    "builder.colWeight": "Peso",
    "builder.colNotes": "Notas",
    "builder.preferred": "preferido",
    "builder.notesPlaceholder": "Notas",
    "builder.swap": "Cambiar",
    "builder.addExercise": "+ Agregar ejercicio",
    "builder.savePlan": "Guardar plan",
    "builder.planSaved": "Plan guardado.",
    "builder.noDraftYet": "Aún no hay borrador para la semana {n}.",
    "builder.buildFrom": "Crea uno a partir del objetivo y los ejercicios preferidos de {name}.",
    "builder.duplicatePreviousWeek": "Duplicar semana anterior",
    "builder.autoSuggest": "Sugerir borrador automáticamente",
    "builder.swapExerciseTitle": "Cambiar ejercicio",
    "builder.addExerciseTitle": "Agregar ejercicio",
    "builder.searchExercises": "Buscar ejercicios…",
    "builder.muscleAll": "Todos",
    "builder.recentlyUsed": "Usados recientemente",
    "builder.allExercises": "Todos los ejercicios",
    "builder.weightUnitBW": "PC",
    "builder.weightUnitKg": "kg",

    "goal.heading": "Detalles de {name}",
    "goal.subheading": "Edita su nombre y el objetivo que da forma a su plan.",
    "goal.nameLabel": "Nombre del cliente",
    "goal.errorMissingName": "Ingresa un nombre.",
    "goal.primaryGoal": "Objetivo principal",
    "goal.targetLabel": "Objetivo",
    "goal.targetPlaceholder": "ej. sentadilla 60kg para octubre",
    "goal.save": "Guardar detalles",
    "goal.saved": "Guardado.",

    "library.heading": "Biblioteca de ejercicios",
    "library.count": "{n} ejercicios · adjunta un enlace de demostración de YouTube a cualquier ejercicio",
    "library.noVideo": "Sin video",
    "library.urlPlaceholder": "https://www.youtube.com/watch?v=…",
    "library.save": "Guardar",
    "library.saved": "Guardado.",
    "library.errorInvalidUrl": "Eso no parece un enlace de YouTube (watch/youtu.be/shorts/embed).",
    "library.addExercise": "+ Agregar ejercicio",
    "library.addExerciseTitle": "Agregar un nuevo ejercicio",
    "library.nameLabel": "Nombre del ejercicio",
    "library.namePlaceholder": "ej. Sentadilla con barra / Barbell squat",
    "library.nameHelp": "Escríbelo en inglés o en español — el otro idioma se completa automáticamente.",
    "library.muscleLabel": "Grupo muscular",
    "library.videoLabelOptional": "Enlace de video (opcional)",
    "library.create": "Agregar a la biblioteca",
    "library.edit": "Editar",
    "library.editExerciseTitle": "Editar ejercicio",
    "library.nameEnLabel": "Nombre (inglés)",
    "library.nameEsLabel": "Nombre (español)",
    "library.saveChanges": "Guardar cambios",
    "library.errorMissingFields": "Ingresa un nombre y elige un grupo muscular.",

    "export.name": "NOMBRE",
    "export.trainer": "ENTRENADOR",
    "export.objective": "OBJETIVO",
    "export.observations": "OBSERVACIONES",
    "export.week": "SEMANA",
    "export.warmup": "CALENTAMIENTO (X4)",
    "export.trainerName": "Gasper",

    "notes.autoTranslated": "(traducción automática)",
    "notes.translationUnavailable": "(traducción no disponible — mostrando el original)",
    "notes.translating": "Traduciendo…",

    "goal.general": "Preparación física general",
    "goal.muscle": "Aumento muscular",
    "goal.loss": "Pérdida de peso",
    "goal.pain": "Manejo del dolor",

    "status.on-track": "Al día",
    "status.plan-due": "Plan pendiente",
    "status.needs-attention": "Necesita atención",
  },
};

export function t(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  let str = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, String(v));
  }
  return str;
}

type LanguageContextValue = { lang: Lang; setLang: (lang: Lang) => void };

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "formline-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") setLangState(stored);
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within a LanguageProvider");
  return ctx;
}

export function useT() {
  const { lang } = useLang();
  return (key: string, vars?: Record<string, string | number>) => t(lang, key, vars);
}
