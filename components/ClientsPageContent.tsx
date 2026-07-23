"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useT, useLang } from "@/lib/i18n";
import { STATUS_TAGCLASS } from "@/lib/constants";

type Row = {
  id: string;
  name: string;
  goal: string;
  week: number;
  status: string;
};

type SortKey = "name" | "goal" | "week" | "status";

export default function ClientsPageContent({ clients }: { clients: Row[] }) {
  const router = useRouter();
  const t = useT();
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

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
      <h2 style={{ marginBottom: 2 }}>{t("roster.heading")}</h2>
      <div className="text-muted" style={{ fontSize: 13 }}>{t("roster.activeThisWeek", { n: activeCount })}</div>

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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
