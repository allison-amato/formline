"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  autoSuggestDraft,
  duplicatePreviousWeek,
  advanceWeek,
  savePlan,
  incrementExerciseUse,
  recordPlanSent,
  translateNote,
  updateClientStatus,
} from "@/app/actions";
import { MUSCLE_LABELS, STATUS_TAGCLASS, type DraftDay } from "@/lib/constants";
import { useLang, useT } from "@/lib/i18n";
import { useUnits, kgToDisplay, displayToKg, weightStep } from "@/lib/units";
import Stepper from "@/components/Stepper";
import { exportPlanToXlsx } from "@/lib/export-xlsx";

type ExerciseLib = {
  id: string;
  nameEn: string;
  nameEs: string;
  muscle: string;
  difficulty: string;
  baseWeight: number | null;
  reps: number;
  useCount: number;
  videoUrl: string | null;
};

type ClientData = {
  id: string;
  name: string;
  goal: string;
  target: string;
  week: number;
  status: string;
  likedIds: string[];
  planSentAt: Date | null;
};

function formatDate(d: Date) {
  const dt = new Date(d);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${dt.getFullYear()}`;
}

type PickerState = {
  open: boolean;
  mode: "add" | "swap" | "warmup" | null;
  dayIndex: number | null;
  rowIndex: number | null;
  search: string;
  muscleFilter: string;
};

const CLOSED_PICKER: PickerState = { open: false, mode: null, dayIndex: null, rowIndex: null, search: "", muscleFilter: "all" };

export default function PlanBuilder({
  client,
  initialDraft,
  hasPreviousWeek,
  allWeeks,
  library: initialLibrary,
}: {
  client: ClientData;
  initialDraft: DraftDay[] | null;
  hasPreviousWeek: boolean;
  allWeeks: Record<number, DraftDay[]>;
  library: ExerciseLib[];
}) {
  const router = useRouter();
  const { lang } = useLang();
  const { unit } = useUnits();
  const t = useT();
  const [days, setDays] = useState<DraftDay[] | null>(initialDraft);
  const [planSentAt, setPlanSentAt] = useState<Date | null>(client.planSentAt);
  const [status, setStatus] = useState(client.status);
  const [editingStatus, setEditingStatus] = useState(false);
  const [dayIndex, setDayIndex] = useState(0);
  const [renamingDay, setRenamingDay] = useState<number | null>(null);
  const [dayNameDraft, setDayNameDraft] = useState("");
  const [picker, setPicker] = useState<PickerState>(CLOSED_PICKER);
  const [showToast, setShowToast] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyTargets, setCopyTargets] = useState<Set<number>>(new Set());
  const [library, setLibrary] = useState<ExerciseLib[]>(initialLibrary);
  const [isPending, startTransition] = useTransition();
  const translationAttempts = useRef<Set<string>>(new Set());

  const libById = Object.fromEntries(library.map((e) => [e.id, e]));
  const exName = (ex: ExerciseLib) => (lang === "es" ? ex.nameEs : ex.nameEn);
  const muscleLabel = (muscle: string) => MUSCLE_LABELS[lang][muscle] ?? muscle;

  // Lazily machine-translate the current day's notes into Spanish, caching
  // the result on the row so we don't re-call the API on every render.
  useEffect(() => {
    if (lang !== "es" || !days) return;
    days[dayIndex].rows.forEach((row, idx) => {
      const text = row.notes?.trim();
      if (!text) return;
      if (row.notesEs && row.notesTranslatedFrom === text) return;
      const attemptKey = `${dayIndex}-${idx}-${text}`;
      if (translationAttempts.current.has(attemptKey)) return;
      translationAttempts.current.add(attemptKey);

      translateNote(text).then((result) => {
        setDays((prev) => {
          if (!prev) return prev;
          const next = prev.map((d) => ({ ...d, rows: d.rows.map((r) => ({ ...r })) }));
          const target = next[dayIndex].rows[idx];
          if (!target || target.notes?.trim() !== text) return prev;
          if (result.ok) {
            target.notesEs = result.translated;
            target.notesTranslatedFrom = text;
          }
          return next;
        });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, dayIndex, days]);

  function onAutoSuggest() {
    startTransition(async () => {
      const newDays = await autoSuggestDraft(client.id, lang);
      setDays(newDays);
      setDayIndex(0);
    });
  }

  function onDuplicatePreviousWeek() {
    startTransition(async () => {
      const newDays = await duplicatePreviousWeek(client.id);
      if (newDays) {
        setDays(newDays);
        setDayIndex(0);
      }
    });
  }

  function onAdvanceWeek() {
    startTransition(async () => {
      const result = await advanceWeek(client.id);
      setStatus(result.status);
      router.refresh();
    });
  }

  function onSavePlan() {
    if (!days) return;
    startTransition(async () => {
      const result = await savePlan(client.id, days);
      setStatus(result.status);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2200);
    });
  }

  function onSetStatus(next: string) {
    startTransition(async () => {
      const result = await updateClientStatus(client.id, next);
      if (result.ok) setStatus(result.status);
      setEditingStatus(false);
    });
  }

  function onExport() {
    if (!days) return;
    exportPlanToXlsx(client, days, libById, lang, allWeeks, unit).catch(() => {});
    recordPlanSent(client.id)
      .then((result) => setPlanSentAt(result.planSentAt))
      .catch(() => {});
  }

  function updateRow(idx: number, patch: Partial<DraftDay["rows"][number]>) {
    setDays((prev) => {
      if (!prev) return prev;
      const next = prev.map((day) => ({ ...day, rows: day.rows.map((row) => ({ ...row })) }));
      next[dayIndex].rows[idx] = { ...next[dayIndex].rows[idx], ...patch };
      return next;
    });
  }

  function openAdd() {
    setPicker({ open: true, mode: "add", dayIndex, rowIndex: null, search: "", muscleFilter: "all" });
  }

  function openSwap(idx: number) {
    const currentId = days![dayIndex].rows[idx].exerciseId;
    const muscle = libById[currentId]?.muscle ?? "all";
    setPicker({ open: true, mode: "swap", dayIndex, rowIndex: idx, search: "", muscleFilter: muscle });
  }

  function openAddWarmup() {
    setPicker({ open: true, mode: "warmup", dayIndex, rowIndex: null, search: "", muscleFilter: "warmup" });
  }

  function pickExercise(ex: ExerciseLib) {
    setDays((prev) => {
      if (!prev) return prev;
      const next = prev.map((day) => ({ ...day, rows: day.rows.map((row) => ({ ...row })) }));
      if (picker.mode === "warmup") {
        const target = next[picker.dayIndex!];
        if (!target.warmupIds.includes(ex.id)) {
          target.warmupIds = [...target.warmupIds, ex.id];
        }
        return next;
      }
      const newItem = { exerciseId: ex.id, sets: 4, reps: ex.reps, weight: ex.baseWeight };
      if (picker.mode === "swap" && picker.rowIndex != null) {
        next[picker.dayIndex!].rows[picker.rowIndex] = newItem;
      } else {
        next[picker.dayIndex!].rows.push(newItem);
      }
      return next;
    });
    setPicker(CLOSED_PICKER);
    setLibrary((prev) => prev.map((e) => (e.id === ex.id ? { ...e, useCount: e.useCount + 1 } : e)));
    incrementExerciseUse(ex.id).catch(() => {});
  }

  function removeWarmupItem(exerciseId: string) {
    setDays((prev) => {
      if (!prev) return prev;
      const next = prev.map((day) => ({ ...day, rows: day.rows.map((row) => ({ ...row })) }));
      next[dayIndex].warmupIds = next[dayIndex].warmupIds.filter((id) => id !== exerciseId);
      return next;
    });
  }

  function setWarmupRounds(rounds: number) {
    setDays((prev) => {
      if (!prev) return prev;
      const next = prev.map((day) => ({ ...day, rows: day.rows.map((row) => ({ ...row })) }));
      next[dayIndex].warmupRounds = Math.max(1, rounds);
      return next;
    });
  }

  function toggleCopyTarget(idx: number) {
    setCopyTargets((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function applyCopyDay() {
    setDays((prev) => {
      if (!prev) return prev;
      const source = prev[dayIndex].rows.map((row) => ({ ...row }));
      const next = prev.map((day) => ({ ...day, rows: day.rows.map((row) => ({ ...row })) }));
      copyTargets.forEach((targetIdx) => {
        next[targetIdx] = { ...next[targetIdx], rows: source.map((row) => ({ ...row })) };
      });
      return next;
    });
    setCopyOpen(false);
    setCopyTargets(new Set());
  }

  function addDay() {
    const newIndex = days ? days.length : 0;
    setDays((prev) => {
      const base = prev ?? [];
      return [...base, { label: t("builder.dayLabel", { n: base.length + 1 }), rows: [], warmupIds: [], warmupRounds: 4 }];
    });
    setDayIndex(newIndex);
  }

  function removeDay(i: number) {
    if (!days || days.length <= 1) return;
    if (!window.confirm(t("builder.removeDayConfirm", { day: days[i].label }))) return;
    setDays((prev) => (prev ? prev.filter((_, idx) => idx !== i) : prev));
    if (i < dayIndex) setDayIndex(dayIndex - 1);
    else if (i === dayIndex) setDayIndex(Math.max(0, i - 1));
  }

  function startRenamingDay(i: number) {
    setRenamingDay(i);
    setDayNameDraft(days![i].label);
  }

  function commitDayName(i: number) {
    const trimmed = dayNameDraft.trim();
    setDays((prev) => {
      if (!prev) return prev;
      return prev.map((d, idx) => (idx === i && trimmed ? { ...d, label: trimmed } : d));
    });
    setRenamingDay(null);
  }

  const goalLabel = t(`goal.${client.goal}`);
  const statusLabel = t(`status.${status}`);
  const statusTagClass = STATUS_TAGCLASS[status] ?? "tag-neutral";
  const statusKeys = Object.keys(STATUS_TAGCLASS);
  const likedChips = client.likedIds.map((id) => (libById[id] ? exName(libById[id]) : null)).filter(Boolean);

  const matchesFilter = (e: ExerciseLib) =>
    exName(e).toLowerCase().includes(picker.search.toLowerCase()) &&
    (picker.muscleFilter === "all" || e.muscle === picker.muscleFilter);

  const recentResults = [...library]
    .filter((e) => e.useCount > 0 && matchesFilter(e))
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, 5);
  const recentIds = new Set(recentResults.map((e) => e.id));
  const otherResults = library.filter((e) => matchesFilter(e) && !recentIds.has(e.id));

  const muscleKeys = Object.keys(MUSCLE_LABELS[lang]);

  const renderPickerRow = (r: ExerciseLib) => (
    <div
      key={r.id}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 2px", cursor: "pointer", borderBottom: "1px solid var(--color-divider)" }}
      onClick={() => pickExercise(r)}
    >
      <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{exName(r)}</div>
      <div className="tag tag-neutral">{muscleLabel(r.muscle)}</div>
    </div>
  );

  return (
    <>
      <Link href="/clients" className="btn btn-ghost">{t("builder.back")}</Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "var(--space-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h3 style={{ margin: 0 }}>{client.name}</h3>
          {editingStatus ? (
            <div style={{ display: "flex", gap: 4 }}>
              {statusKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`btn ${status === key ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: 11, padding: "3px 9px" }}
                  disabled={isPending}
                  onClick={() => onSetStatus(key)}
                >
                  {t(`status.${key}`)}
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              className={`tag ${statusTagClass}`}
              style={{ cursor: "pointer", border: "none" }}
              title={t("builder.changeStatus")}
              onClick={() => setEditingStatus(true)}
            >
              {statusLabel}
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {days && (
            <button className="btn btn-secondary" style={{ fontSize: 12.5 }} onClick={onExport}>
              {t("builder.export")}
            </button>
          )}
          <button className="btn btn-secondary" style={{ fontSize: 12.5 }} disabled={isPending} onClick={onAdvanceWeek}>
            {t("builder.startWeek", { n: client.week + 1 })}
          </button>
          <Link href={`/clients/${client.id}/goal`} className="btn btn-secondary" style={{ fontSize: 12.5 }}>
            {t("builder.editGoal")}
          </Link>
        </div>
      </div>
      <div className="text-muted" style={{ fontSize: 13 }}>
        {t("builder.targetLine", { goal: goalLabel, target: client.target, week: client.week })}
      </div>
      {planSentAt && (
        <div className="text-muted" style={{ fontSize: 12 }}>
          {t("builder.planSentOn", { date: formatDate(planSentAt) })}
        </div>
      )}

      <div style={{ marginTop: "var(--space-4)" }}>
        <h6>{t("builder.preferenceHistory")}</h6>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "var(--space-2)" }}>
          {likedChips.map((label) => (
            <div key={label} className="tag tag-outline">{label}</div>
          ))}
        </div>
      </div>

      {days ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "var(--space-4)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              {days.map((day, i) => {
                const active = dayIndex === i;
                if (active && renamingDay === i) {
                  return (
                    <input
                      key={i}
                      className="input"
                      autoFocus
                      style={{ fontSize: 12.5, padding: "5px 9px", width: 130 }}
                      value={dayNameDraft}
                      onChange={(e) => setDayNameDraft(e.target.value)}
                      onBlur={() => commitDayName(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitDayName(i);
                      }}
                    />
                  );
                }
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <button
                      type="button"
                      className={`btn ${active ? "btn-primary" : "btn-secondary"}`}
                      style={{ fontSize: 12.5 }}
                      title={active ? t("builder.renameDayHint") : undefined}
                      onClick={() => (active ? startRenamingDay(i) : setDayIndex(i))}
                    >
                      {day.label}
                    </button>
                    {days.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: 13, padding: "0 6px" }}
                        title={t("builder.removeDay")}
                        onClick={() => removeDay(i)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={addDay}>
                {t("builder.addDay")}
              </button>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setCopyOpen((v) => !v)}>
              {t("builder.copyDayTo", { day: days[dayIndex].label })}
            </button>
          </div>

          {copyOpen && (
            <div className="card" style={{ marginTop: "var(--space-2)", maxWidth: 420 }}>
              <div className="text-muted" style={{ fontSize: 12 }}>{t("builder.applyExercisesTo", { day: days[dayIndex].label })}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {days.map((day, i) =>
                  i === dayIndex ? null : (
                    <label key={i} className="radio" style={{ fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={copyTargets.has(i)}
                        onChange={() => toggleCopyTarget(i)}
                        style={{ position: "static", opacity: 1, width: "auto", height: "auto", pointerEvents: "auto" }}
                      />
                      {day.label}
                    </label>
                  )
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary" style={{ fontSize: 12.5 }} disabled={copyTargets.size === 0} onClick={applyCopyDay}>
                  {t("builder.apply")}
                </button>
                <button className="btn btn-secondary" style={{ fontSize: 12.5 }} onClick={() => { setCopyOpen(false); setCopyTargets(new Set()); }}>
                  {t("builder.cancel")}
                </button>
              </div>
            </div>
          )}

          <div className="card" style={{ marginTop: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <h6 style={{ margin: 0 }}>{t("builder.warmup")}</h6>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="text-muted" style={{ fontSize: 12 }}>{t("builder.warmupRounds")}</span>
                <Stepper value={days[dayIndex].warmupRounds} min={1} onChange={setWarmupRounds} />
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "var(--space-2)" }}>
              {days[dayIndex].warmupIds.map((id) => {
                const ex = libById[id];
                return (
                  <div key={id} className="tag tag-neutral" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {ex ? exName(ex) : id}
                    <button
                      type="button"
                      onClick={() => removeWarmupItem(id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1, color: "inherit" }}
                      title={t("builder.removeWarmupItem")}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={openAddWarmup}>
                {t("builder.addWarmup")}
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: "var(--space-3)", overflowX: "auto", padding: 0 }}>
            <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-divider)", textAlign: "left" }}>
                  <th style={{ padding: "8px 10px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-neutral-600)" }}>{t("builder.colExercise")}</th>
                  <th style={{ padding: "8px 10px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-neutral-600)" }}>{t("builder.colMuscle")}</th>
                  <th style={{ padding: "8px 10px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-neutral-600)", width: 92 }}>{t("builder.colSets")}</th>
                  <th style={{ padding: "8px 10px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-neutral-600)", width: 92 }}>{t("builder.colReps")}</th>
                  <th style={{ padding: "8px 10px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-neutral-600)", width: 108 }}>{t("builder.colWeight")}</th>
                  <th style={{ padding: "8px 10px", fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-neutral-600)", width: 170 }}>{t("builder.colNotes")}</th>
                  <th style={{ padding: "8px 10px", width: 70 }}></th>
                </tr>
              </thead>
              <tbody>
                {days[dayIndex].rows.map((row, idx) => {
                  const lib = libById[row.exerciseId];
                  const preferred = client.likedIds.includes(row.exerciseId);
                  const weightDisabled = row.weight == null;
                  const notesText = row.notes?.trim() ?? "";
                  const showTranslated = lang === "es" && notesText && row.notesTranslatedFrom === notesText;
                  const translationFailed = lang === "es" && notesText && !showTranslated && translationAttempts.current.has(`${dayIndex}-${idx}-${notesText}`);
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                      <td style={{ padding: 10 }}>
                        {lib ? exName(lib) : ""}
                        {preferred && (
                          <span className="tag tag-accent" style={{ marginLeft: 6, fontSize: 10, verticalAlign: "middle" }}>
                            {t("builder.preferred")}
                          </span>
                        )}
                      </td>
                      <td className="text-muted" style={{ padding: 10 }}>{lib ? muscleLabel(lib.muscle) : ""}</td>
                      <td style={{ padding: "8px 4px" }}>
                        <Stepper value={row.sets} onChange={(v) => updateRow(idx, { sets: v })} />
                      </td>
                      <td style={{ padding: "8px 4px" }}>
                        <Stepper value={row.reps} onChange={(v) => updateRow(idx, { reps: v })} />
                      </td>
                      <td style={{ padding: "8px 4px" }}>
                        <Stepper
                          value={row.weight == null ? null : kgToDisplay(row.weight, unit)}
                          onChange={(v) => updateRow(idx, { weight: displayToKg(v, unit) })}
                          step={weightStep(unit)}
                          disabled={weightDisabled}
                          placeholder={weightDisabled ? t("builder.weightUnitBW") : unit === "lb" ? t("builder.weightUnitLb") : t("builder.weightUnitKg")}
                        />
                      </td>
                      <td style={{ padding: "8px 4px" }}>
                        <input
                          className="input"
                          style={{ fontSize: 12.5, padding: "5px 8px" }}
                          placeholder={t("builder.notesPlaceholder")}
                          value={lang === "en" ? (row.notes ?? "") : showTranslated ? (row.notesEs ?? "") : (row.notes ?? "")}
                          onChange={(e) => updateRow(idx, { notes: e.target.value, notesEs: undefined, notesTranslatedFrom: undefined })}
                        />
                        {lang === "es" && notesText && !showTranslated && (
                          <div className="text-muted" style={{ fontSize: 10, marginTop: 2 }}>
                            {translationFailed ? t("notes.translationUnavailable") : t("notes.translating")}
                          </div>
                        )}
                        {showTranslated && (
                          <div className="text-muted" style={{ fontSize: 10, marginTop: 2 }}>{t("notes.autoTranslated")}</div>
                        )}
                      </td>
                      <td style={{ padding: 10, textAlign: "right" }}>
                        <button className="btn btn-secondary" style={{ fontSize: 11.5, padding: "5px 10px" }} onClick={() => openSwap(idx)}>
                          {t("builder.swap")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button className="btn btn-secondary" style={{ marginTop: "var(--space-3)" }} onClick={openAdd}>
            {t("builder.addExercise")}
          </button>

          <div>
            <button className="btn btn-primary" style={{ marginTop: "var(--space-4)" }} disabled={isPending} onClick={onSavePlan}>
              {t("builder.savePlan")}
            </button>
            {showToast && (
              <span style={{ marginLeft: 12, fontSize: 12.5, color: "var(--color-accent-700)", fontWeight: 600 }}>
                {t("builder.planSaved")}
              </span>
            )}
          </div>
        </>
      ) : (
        <div style={{ marginTop: "var(--space-8)", textAlign: "center", padding: "0 10px", maxWidth: 480, marginInline: "auto" }}>
          <div style={{ fontSize: 15, lineHeight: 1.5 }}>
            {t("builder.noDraftYet", { n: client.week })}<br />
            {t("builder.buildFrom", { name: client.name.split(" ")[0] })}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: "var(--space-4)" }}>
            {hasPreviousWeek && (
              <button className="btn btn-secondary" disabled={isPending} onClick={onDuplicatePreviousWeek}>
                {t("builder.duplicatePreviousWeek")}
              </button>
            )}
            <button className="btn btn-primary" disabled={isPending} onClick={onAutoSuggest}>
              {t("builder.autoSuggest")}
            </button>
          </div>
        </div>
      )}

      {picker.open && (
        <div className="dialog-backdrop" style={{ position: "fixed", inset: 0, padding: "var(--space-6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="dialog" style={{ width: 520, maxHeight: "74vh" }}>
            <div className="dialog-title">
              {picker.mode === "swap"
                ? t("builder.swapExerciseTitle")
                : picker.mode === "warmup"
                ? t("builder.addWarmupTitle")
                : t("builder.addExerciseTitle")}
            </div>
            <input
              className="input"
              placeholder={t("builder.searchExercises")}
              value={picker.search}
              onChange={(e) => setPicker((p) => ({ ...p, search: e.target.value }))}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[{ key: "all", label: t("builder.muscleAll") }, ...muscleKeys.map((k) => ({ key: k, label: MUSCLE_LABELS[lang][k] }))].map((m) => {
                const active = picker.muscleFilter === m.key;
                return (
                  <button
                    key={m.key}
                    className={`btn ${active ? "btn-primary" : "btn-secondary"}`}
                    style={{ fontSize: 11, padding: "4px 9px" }}
                    onClick={() => setPicker((p) => ({ ...p, muscleFilter: m.key }))}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {recentResults.length > 0 && (
                <>
                  <div className="text-muted" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".06em", padding: "6px 2px 2px" }}>
                    {t("builder.recentlyUsed")}
                  </div>
                  {recentResults.map(renderPickerRow)}
                  <div className="text-muted" style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".06em", padding: "10px 2px 2px" }}>
                    {t("builder.allExercises")}
                  </div>
                </>
              )}
              {otherResults.map(renderPickerRow)}
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setPicker(CLOSED_PICKER)}>{t("builder.cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
