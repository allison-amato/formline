"use client";

import { useState, useTransition } from "react";
import { updateExerciseVideo } from "@/app/actions";
import { extractYoutubeId } from "@/lib/youtube";
import { MUSCLE_LABELS } from "@/lib/constants";
import { useLang, useT } from "@/lib/i18n";

type Exercise = {
  id: string;
  nameEn: string;
  nameEs: string;
  muscle: string;
  videoUrl: string | null;
};

export default function ExerciseLibraryEditor({ exercises }: { exercises: Exercise[] }) {
  const { lang } = useLang();
  const t = useT();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(exercises.map((e) => [e.id, e.videoUrl ?? ""]))
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [savedFlash, setSavedFlash] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  function onSave(id: string) {
    const value = values[id] ?? "";
    startTransition(async () => {
      const result = await updateExerciseVideo(id, value);
      if (result.ok) {
        setErrors((prev) => ({ ...prev, [id]: undefined }));
        setValues((prev) => ({ ...prev, [id]: result.videoUrl ?? "" }));
        setSavedFlash((prev) => ({ ...prev, [id]: true }));
        setTimeout(() => setSavedFlash((prev) => ({ ...prev, [id]: false })), 2200);
      } else {
        setErrors((prev) => ({ ...prev, [id]: t("library.errorInvalidUrl") }));
      }
    });
  }

  return (
    <>
      <h2 style={{ marginBottom: 2 }}>{t("library.heading")}</h2>
      <div className="text-muted" style={{ fontSize: 13 }}>{t("library.count", { n: exercises.length })}</div>

      <div className="card" style={{ marginTop: "var(--space-5)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {exercises.map((ex) => {
            const value = values[ex.id] ?? "";
            const error = errors[ex.id];
            const previewId = value.trim() ? extractYoutubeId(value.trim()) : null;
            return (
              <div
                key={ex.id}
                style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingBottom: "var(--space-3)", borderBottom: "1px solid var(--color-divider)" }}
              >
                <div style={{ width: 96, flex: "none" }}>
                  {previewId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://img.youtube.com/vi/${previewId}/hqdefault.jpg`}
                      alt=""
                      style={{ width: 96, height: 54, objectFit: "cover", border: "1px solid var(--color-divider)" }}
                    />
                  ) : (
                    <div
                      className="text-muted"
                      style={{ width: 96, height: 54, border: "1px dashed var(--color-divider)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}
                    >
                      {t("library.noVideo")}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{lang === "es" ? ex.nameEs : ex.nameEn}</div>
                  <div className="text-muted" style={{ fontSize: 11.5, marginBottom: 6 }}>{MUSCLE_LABELS[lang][ex.muscle] ?? ex.muscle}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      className="input"
                      style={{ maxWidth: 380, fontSize: 13 }}
                      placeholder={t("library.urlPlaceholder")}
                      value={value}
                      onChange={(e) => setValues((prev) => ({ ...prev, [ex.id]: e.target.value }))}
                    />
                    <button className="btn btn-secondary" style={{ fontSize: 12.5 }} disabled={isPending} onClick={() => onSave(ex.id)}>
                      {t("library.save")}
                    </button>
                    {savedFlash[ex.id] && (
                      <span style={{ fontSize: 12, color: "var(--color-accent-700)", fontWeight: 600 }}>{t("library.saved")}</span>
                    )}
                  </div>
                  {error && (
                    <div style={{ fontSize: 12, color: "#a13636", marginTop: 4 }}>{error}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
