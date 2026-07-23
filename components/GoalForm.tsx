"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveGoal } from "@/app/actions";
import { useT } from "@/lib/i18n";

const GOAL_KEYS = ["general", "muscle", "loss", "pain"];

export default function GoalForm({
  clientId,
  clientName,
  initialGoal,
  initialTarget,
}: {
  clientId: string;
  clientName: string;
  initialGoal: string;
  initialTarget: string;
}) {
  const t = useT();
  const [goal, setGoal] = useState(initialGoal);
  const [target, setTarget] = useState(initialTarget);
  const [showToast, setShowToast] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      await saveGoal(clientId, goal, target);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2200);
    });
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <Link href="/clients" className="btn btn-ghost">{t("builder.back")}</Link>
      <h2 style={{ marginTop: "var(--space-2)" }}>{t("goal.heading", { name: clientName })}</h2>
      <div className="text-muted" style={{ fontSize: 13 }}>{t("goal.subheading")}</div>

      <h6 style={{ marginTop: "var(--space-6)" }}>{t("goal.primaryGoal")}</h6>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
        {GOAL_KEYS.map((key) => (
          <label key={key} className="radio">
            <input type="radio" name="goaltype" checked={goal === key} onChange={() => setGoal(key)} />
            <span className="dot" />
            {t(`goal.${key}`)}
          </label>
        ))}
      </div>

      <div className="field" style={{ marginTop: "var(--space-6)" }}>
        <label>{t("goal.targetLabel")}</label>
        <input
          className="input"
          placeholder={t("goal.targetPlaceholder")}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
      </div>

      <button className="btn btn-primary" disabled={isPending} onClick={onSave}>
        {t("goal.save")}
      </button>
      {showToast && (
        <span style={{ marginLeft: 12, fontSize: 12.5, color: "var(--color-accent-700)", fontWeight: 600 }}>
          {t("goal.saved")}
        </span>
      )}
    </div>
  );
}
