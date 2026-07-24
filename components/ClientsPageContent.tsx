"use client";

import { useMemo, useState, useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient, deleteClient } from "@/app/actions";
import { useT, useLang } from "@/lib/i18n";
import { GOAL_SCHEME, STATUS_TAGCLASS } from "@/lib/constants";
import Stepper from "@/components/Stepper";

type Row = {
  id: string;
  name: string;
  goal: string;
  week: number;
  status: string;
};

type SortKey = "name" | "goal" | "week" | "status";

const GOAL_KEYS = Object.keys(GOAL_SCHEME);
const STATUS_KEYS = Object.keys(STATUS_TAGCLASS);
const EMPTY_FORM = { name: "", goal: "", week: 1, status: "on-track" };

export default function ClientsPageContent({ clients: initialClients }: { clients: Row[] }) {
  const router = useRouter();
  const t = useT();
  const { lang } = useLang();
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | undefined>();
  const [isCreating, startCreating] = useTransition();

  const activeCount = clients.length;
  const plansDueCount = clients.filter((c) => c.status === "plan-due").length;
  const attentionCount = clients.filter((c) => c.status === "needs-attention").length;

  const sortFns: Record<SortKey, (r: Row) => string | number> = {
    name: (r) => r.name,
    goal: (r) => t(`goal.${r.goal}`),
    week: (r) => r.week,
    status: (r) => t(`status.${r.status}`),
  };

  const rows = useMemo(() => {
    const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    const fn = sortFns[sortKey];
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = fn(a);
      const bv = fn(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, search, sortKey, sortDir, lang]);

  function toggleSort(key: SortKey) {
    setSortDir((dir) => (sortKey === key ? (dir === "asc" ? "desc" : "asc") : "asc"));
    setSortKey(key);
  }

  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  function openDialog() {
    setForm(EMPTY_FORM);
    setCreateError(undefined);
    setDialogOpen(true);
  }

  function onCreate() {
    setCreateError(undefined);
    startCreating(async () => {
      const result = await createClient(form);
      if (result.ok) {
        setClients((prev) => [...prev, result.client]);
        setDialogOpen(false);
      } else {
        setCreateError(t("roster.errorMissingFields"));
      }
    });
  }

  function onDelete(e: MouseEvent, client: Row) {
    e.stopPropagation();
    if (!window.confirm(t("roster.removeConfirm", { name: client.name }))) return;
    setClients((prev) => prev.filter((c) => c.id !== client.id));
    deleteClient(client.id).catch(() => {});
  }

  const canCreate = form.name.trim() !== "" && form.goal !== "" && form.status !== "";

  const th = (label: string, key: SortKey) => (
    <th
      style={{
        padding: "8px 10px",
        fontSize: 11.5,
        textTransform: "uppercase",
        letterSpacing: ".06em",
        color: "var(--color-neutral-600)",
        cursor: "pointer",
        fontWeight: 600,
      }}
      onClick={() => toggleSort(key)}
    >
      {label}
      {arrow(key)}
    </th>
  );

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)" }}>
        <div>
          <h2 style={{ marginBottom: 2 }}>{t("roster.heading")}</h2>
          <div className="text-muted" style={{ fontSize: 13 }}>{t("roster.activeThisWeek", { n: activeCount })}</div>
        </div>
        <button className="btn btn-primary" style={{ flex: "none" }} onClick={openDialog}>
          {t("roster.addClient")}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "var(--space-3)",
          marginTop: "var(--space-4)",
          maxWidth: 640,
        }}
      >
        <div className="card">
          <h3 style={{ margin: 0, color: "var(--color-accent-800)" }}>{activeCount}</h3>
          <div className="text-muted" style={{ fontSize: 11.5 }}>{t("roster.statActive")}</div>
        </div>
        <div className="card">
          <h3 style={{ margin: 0, color: "var(--color-accent-800)" }}>{plansDueCount}</h3>
          <div className="text-muted" style={{ fontSize: 11.5 }}>{t("roster.statPlansDue")}</div>
        </div>
        <div className="card">
          <h3 style={{ margin: 0, color: "var(--color-accent-800)" }}>{attentionCount}</h3>
          <div className="text-muted" style={{ fontSize: 11.5 }}>{t("roster.statAttention")}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "var(--space-5)" }}>
        <input
          className="input"
          placeholder={t("roster.searchPlaceholder")}
          style={{ maxWidth: 280 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "var(--space-4)" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-divider)", textAlign: "left" }}>
              {th(t("roster.colClient"), "name")}
              {th(t("roster.colGoal"), "goal")}
              {th(t("roster.colWeek"), "week")}
              {th(t("roster.colStatus"), "status")}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                style={{ borderBottom: "1px solid var(--color-divider)", cursor: "pointer" }}
                onClick={() => router.push(`/clients/${c.id}`)}
              >
                <td style={{ padding: "12px 10px", fontWeight: 600 }}>{c.name}</td>
                <td className="text-muted" style={{ padding: "12px 10px" }}>{t(`goal.${c.goal}`)}</td>
                <td className="text-muted" style={{ padding: "12px 10px", fontVariantNumeric: "tabular-nums" }}>
                  {t("roster.weekValue", { n: c.week })}
                </td>
                <td style={{ padding: "12px 10px" }}>
                  <div className={`tag ${STATUS_TAGCLASS[c.status] ?? "tag-neutral"}`}>{t(`status.${c.status}`)}</div>
                </td>
                <td style={{ padding: "12px 10px", textAlign: "right" }}>
                  <button className="btn btn-ghost" style={{ fontSize: 11.5 }} onClick={(e) => onDelete(e, c)}>
                    {t("roster.remove")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <div className="dialog-backdrop" style={{ position: "fixed", inset: 0, padding: "var(--space-6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="dialog" style={{ width: 440 }}>
            <div className="dialog-title">{t("roster.addClientTitle")}</div>

            <div className="field">
              <label>{t("roster.nameLabel")}</label>
              <input
                className="input"
                placeholder={t("roster.namePlaceholder")}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="field">
              <label>{t("goal.primaryGoal")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {GOAL_KEYS.map((key) => {
                  const active = form.goal === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`btn ${active ? "btn-primary" : "btn-secondary"}`}
                      style={{ fontSize: 11.5, padding: "5px 10px" }}
                      onClick={() => setForm((prev) => ({ ...prev, goal: key }))}
                    >
                      {t(`goal.${key}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label>{t("roster.statusLabel")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {STATUS_KEYS.map((key) => {
                  const active = form.status === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`btn ${active ? "btn-primary" : "btn-secondary"}`}
                      style={{ fontSize: 11.5, padding: "5px 10px" }}
                      onClick={() => setForm((prev) => ({ ...prev, status: key }))}
                    >
                      {t(`status.${key}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label>{t("roster.weekLabel")}</label>
              <Stepper value={form.week} min={1} onChange={(v) => setForm((prev) => ({ ...prev, week: v }))} />
            </div>

            {createError && (
              <div style={{ fontSize: 12, color: "#a13636" }}>{createError}</div>
            )}

            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setDialogOpen(false)}>{t("builder.cancel")}</button>
              <button className="btn btn-primary" disabled={!canCreate || isCreating} onClick={onCreate}>
                {t("roster.create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
