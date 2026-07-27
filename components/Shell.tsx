"use client";

import Link from "next/link";
import { useLang, useT } from "@/lib/i18n";

export default function Shell({
  children,
  active = "clients",
}: {
  children: React.ReactNode;
  active?: "clients" | "library";
}) {
  const { lang, setLang } = useLang();
  const t = useT();

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "28px 32px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div className="nav-brand" style={{ fontSize: 20 }}>
            GuardaForma
          </div>
          <div className="text-muted" style={{ fontSize: 13, flex: 1 }}>
            {t("nav.subtitle")}
          </div>
          <div className="seg" style={{ flex: "none" }}>
            <label className="seg-opt">
              <input type="radio" name="applang" checked={lang === "en"} onChange={() => setLang("en")} />
              EN
            </label>
            <label className="seg-opt">
              <input type="radio" name="applang" checked={lang === "es"} onChange={() => setLang("es")} />
              ES
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
          <div
            className="card"
            style={{ flex: "none", width: 196, padding: "var(--space-3)", position: "sticky", top: 28, display: "flex", flexDirection: "column", gap: 4 }}
          >
            <Link
              href="/clients"
              className={`btn ${active === "clients" ? "btn-primary" : "btn-ghost"}`}
              style={{ width: "100%", justifyContent: "flex-start" }}
            >
              {t("nav.clients")}
            </Link>
            <Link
              href="/library"
              className={`btn ${active === "library" ? "btn-primary" : "btn-ghost"}`}
              style={{ width: "100%", justifyContent: "flex-start" }}
            >
              {t("nav.library")}
            </Link>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
