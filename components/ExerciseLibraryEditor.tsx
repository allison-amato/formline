"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createExercise, translateNote, updateExercise, updateExerciseVideo } from "@/app/actions";
import { extractYoutubeId } from "@/lib/youtube";
import { MUSCLE_KEYS, MUSCLE_LABELS } from "@/lib/constants";
import { useLang, useT } from "@/lib/i18n";

type Exercise = {
  id: string;
  nameEn: string;
  nameEs: string;
  muscle: string;
  videoUrl: string | null;
};

const EMPTY_FORM = { name: "", muscle: "", videoUrl: "" };

export default function ExerciseLibraryEditor({ exercises: initialExercises }: { exercises: Exercise[] }) {
  const { lang } = useLang();
  const t = useT();
  const [exercises, setExercises] = useState(initialExercises);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(initialExercises.map((e) => [e.id, e.videoUrl ?? ""]))
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [savedFlash, setSavedFlash] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | undefined>();
  const [isCreating, startCreating] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nameEn: "", nameEs: "", videoUrl: "" });
  const [editError, setEditError] = useState<string | undefined>();
  const [isEditing, startEditing] = useTransition();

  // Exercises created while the translate API was unavailable are saved
  // with nameEs === nameEn as a fallback. Lazily machine-translate those to
  // Spanish on first view, caching the result here (not persisted to the
  // exercise record — same lazy/ephemeral pattern as plan notes).
  const [esOverrides, setEsOverrides] = useState<Record<string, string>>({});
  const translationAttempts = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (lang !== "es") return;
    exercises.forEach((ex) => {
      const untranslated = ex.nameEn.trim().toLowerCase() === ex.nameEs.trim().toLowerCase();
      if (!untranslated || esOverrides[ex.id] || translationAttempts.current.has(ex.id)) return;
      translationAttempts.current.add(ex.id);
      translateNote(ex.nameEn).then((result) => {
        if (result.ok) {
          setEsOverrides((prev) => ({ ...prev, [ex.id]: result.translated }));
        }
      });
    });
  }, [lang, exercises, esOverrides]);

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

  function openDialog() {
    setForm(EMPTY_FORM);
    setCreateError(undefined);
    setDialogOpen(true);
  }

  function onCreate() {
    setCreateError(undefined);
    startCreating(async () => {
      const result = await createExercise(form);
      if (result.ok) {
        const created = result.exercise;
        setExercises((prev) => [{ ...created }, ...prev]);
        setValues((prev) => ({ ...prev, [created.id]: created.videoUrl ?? "" }));
        setDialogOpen(false);
      } else if (result.errorCode === "invalid_url") {
        setCreateError(t("library.errorInvalidUrl"));
      } else {
        setCreateError(t("library.errorMissingFields"));
      }
    });
  }

  const canCreate = form.name.trim() !== "" && form.muscle !== "";

  function openEdit(ex: Exercise) {
    setEditingId(ex.id);
    setEditForm({ nameEn: ex.nameEn, nameEs: ex.nameEs, videoUrl: values[ex.id] ?? ex.videoUrl ?? "" });
    setEditError(undefined);
  }

  function onSaveEdit() {
    if (!editingId) return;
    const id = editingId;
    setEditError(undefined);
    startEditing(async () => {
      const result = await updateExercise(id, editForm);
      if (result.ok) {
        setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...result.exercise } : e)));
        setValues((prev) => ({ ...prev, [id]: result.exercise.videoUrl ?? "" }));
        setEsOverrides((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setEditingId(null);
      } else if (result.errorCode === "invalid_url") {
        setEditError(t("library.errorInvalidUrl"));
      } else {
        setEditError(t("library.errorMissingFields"));
      }
    });
  }

  const canSaveEdit = editForm.nameEn.trim() !== "" && editForm.nameEs.trim() !== "";

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)" }}>
        <div>
          <h2 style={{ marginBottom: 2 }}>{t("library.heading")}</h2>
          <div className="text-muted" style={{ fontSize: 13 }}>{t("library.count", { n: exercises.length })}</div>
        </div>
        <button className="btn btn-primary" style={{ flex: "none" }} onClick={openDialog}>
          {t("library.addExercise")}
        </button>
      </div>

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
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{lang === "es" ? (esOverrides[ex.id] ?? ex.nameEs) : ex.nameEn}</div>
                    <button className="btn btn-ghost" style={{ fontSize: 11.5, padding: "1px 6px" }} onClick={() => openEdit(ex)}>
                      {t("library.edit")}
                    </button>
                  </div>
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

      {dialogOpen && (
        <div className="dialog-backdrop" style={{ position: "fixed", inset: 0, padding: "var(--space-6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="dialog" style={{ width: 480 }}>
            <div className="dialog-title">{t("library.addExerciseTitle")}</div>

            <div className="field">
              <label>{t("library.nameLabel")}</label>
              <input
                className="input"
                placeholder={t("library.namePlaceholder")}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                {t("library.nameHelp")}
              </div>
            </div>

            <div className="field">
              <label>{t("library.muscleLabel")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {MUSCLE_KEYS.map((key) => {
                  const active = form.muscle === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`btn ${active ? "btn-primary" : "btn-secondary"}`}
                      style={{ fontSize: 11.5, padding: "5px 10px" }}
                      onClick={() => setForm((prev) => ({ ...prev, muscle: key }))}
                    >
                      {MUSCLE_LABELS[lang][key]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label>{t("library.videoLabelOptional")}</label>
              <input
                className="input"
                placeholder={t("library.urlPlaceholder")}
                value={form.videoUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
              />
            </div>

            {createError && (
              <div style={{ fontSize: 12, color: "#a13636" }}>{createError}</div>
            )}

            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setDialogOpen(false)}>{t("builder.cancel")}</button>
              <button className="btn btn-primary" disabled={!canCreate || isCreating} onClick={onCreate}>
                {t("library.create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingId && (
        <div className="dialog-backdrop" style={{ position: "fixed", inset: 0, padding: "var(--space-6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="dialog" style={{ width: 480 }}>
            <div className="dialog-title">{t("library.editExerciseTitle")}</div>

            <div className="field">
              <label>{t("library.nameEnLabel")}</label>
              <input
                className="input"
                value={editForm.nameEn}
                onChange={(e) => setEditForm((prev) => ({ ...prev, nameEn: e.target.value }))}
              />
            </div>

            <div className="field">
              <label>{t("library.nameEsLabel")}</label>
              <input
                className="input"
                value={editForm.nameEs}
                onChange={(e) => setEditForm((prev) => ({ ...prev, nameEs: e.target.value }))}
              />
            </div>

            <div className="field">
              <label>{t("library.videoLabelOptional")}</label>
              <input
                className="input"
                placeholder={t("library.urlPlaceholder")}
                value={editForm.videoUrl}
                onChange={(e) => setEditForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
              />
            </div>

            {editError && (
              <div style={{ fontSize: 12, color: "#a13636" }}>{editError}</div>
            )}

            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setEditingId(null)}>{t("builder.cancel")}</button>
              <button className="btn btn-primary" disabled={!canSaveEdit || isEditing} onClick={onSaveEdit}>
                {t("library.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
