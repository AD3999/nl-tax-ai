/* TaxWijs — Admin Dashboard + Rules Table */

function AdminShell({ active = "dash", children }) {
  const items = [
    { id: "dash",  label: "Dashboard",          glyph: "01" },
    { id: "rules", label: "Rules",              glyph: "02" },
    { id: "calc",  label: "Calculator preview", glyph: "03" },
    { id: "rag",   label: "RAG preview",        glyph: "04" },
    { id: "set",   label: "Settings",           glyph: "05" },
  ];
  return (
    <div className="tw" style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "240px 1fr", background: "var(--paper)" }}>
      {/* Dark sidebar */}
      <aside style={{ background: "var(--ink)", color: "var(--paper)", padding: "22px 14px", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 8px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Wordmark size={14} dark />
          <span className="pill" style={{ background: "rgba(255,255,255,0.10)", color: "white", padding: "2px 8px" }}>Admin</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map(it => {
            const on = it.id === active;
            return (
              <a key={it.id} style={{
                padding: "9px 10px", borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", gap: 10,
                background: on ? "rgba(255,255,255,0.10)" : "transparent",
                color: on ? "white" : "oklch(0.78 0.01 95)", fontSize: 13.5, cursor: "pointer",
              }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: on ? "var(--sage-500)" : "rgba(255,255,255,0.08)", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600 }}>{it.glyph}</span>
                {it.label}
              </a>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", padding: 12, background: "rgba(255,255,255,0.06)", borderRadius: "var(--r)" }}>
          <div className="eyebrow" style={{ color: "var(--sage-300)" }}>Knowledge base</div>
          <div className="font-mono" style={{ marginTop: 6, fontSize: 13, color: "white" }}>28 rules · 12 QA</div>
          <div style={{ fontSize: 11, color: "oklch(0.75 0.01 95)", marginTop: 4 }}>Last indexed 14 min ago</div>
        </div>
        <a style={{ marginTop: 12, fontSize: 12, color: "oklch(0.75 0.01 95)", padding: "0 8px" }}>← Back to app</a>
      </aside>

      {/* Content */}
      <div style={{ overflow: "auto" }}>
        {/* Topbar */}
        <header style={{ height: 64, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--hairline)", background: "var(--paper)", position: "sticky", top: 0, zIndex: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink-3)" }}>
            <span>Admin</span><span>/</span>
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>{items.find(i => i.id === active)?.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }}>
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
              </svg>
              <input className="input" placeholder="Search rules, QA, scenarios…" style={{ width: 280, height: 36, paddingLeft: 34 }} />
            </div>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>anna@taxwijs.nl</span>
            <span style={{ width: 30, height: 30, borderRadius: 999, background: "var(--sage-600)", color: "white", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600 }}>A</span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function AdminDashboardDesktop() {
  return (
    <AdminShell active="dash">
      <div style={{ padding: "28px 32px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div className="eyebrow eyebrow-accent">Overview</div>
            <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 36, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Knowledge base health
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm">Run validate.py</button>
            <button className="btn btn-ghost btn-sm">Rebuild index</button>
            <button className="btn btn-accent btn-sm">+ New rule</button>
          </div>
        </div>

        {/* Stat grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1, background: "var(--hairline)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          {[
            { k: "Total rules",    v: "28",  trend: "+2 wk", tone: "ink" },
            { k: "Verified",       v: "24",  trend: "86%",   tone: "ok" },
            { k: "Pending review", v: "3",   trend: "1 stale", tone: "warn" },
            { k: "Draft",          v: "1",   trend: "—",     tone: "ink" },
            { k: "Expired",        v: "0",   trend: "clean", tone: "ok" },
            { k: "Expiring soon",  v: "2",   trend: "≤ 90d", tone: "warn" },
          ].map(s => (
            <div key={s.k} style={{ padding: "18px 18px 20px", background: "var(--paper)" }}>
              <div className="eyebrow">{s.k}</div>
              <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="font-serif" style={{ fontSize: 36, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.v}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 11.5, color: s.tone === "ok" ? "var(--ok)" : s.tone === "warn" ? "oklch(0.55 0.16 75)" : "var(--ink-3)" }}>
                {s.trend}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
          {/* Needing attention */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline)" }}>
              <div>
                <div className="eyebrow eyebrow-accent">Needs attention</div>
                <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500, marginTop: 4 }}>3 rules waiting review</div>
              </div>
              <a style={{ fontSize: 12.5, color: "var(--sage-700)" }}>View all →</a>
            </div>
            <div>
              {[
                { id: "ZZP-2026-MKB",      t: "MKB-winstvrijstelling rate change",  status: "pending",  when: "2 days" },
                { id: "DGA-2026-BOX2",     t: "Box 2 progressive ceiling lifted",    status: "pending",  when: "5 days" },
                { id: "EXP-2026-RULING-Y3","t": "30%-ruling stage-down clarification", status: "pending",when: "1 week" },
                { id: "ZZP-2026-START",    t: "Startersaftrek — sunset 2026",       status: "expiring", when: "85 days" },
              ].map((r, i) => (
                <div key={r.id} style={{ padding: "14px 22px", display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 14, alignItems: "center", borderTop: i ? "1px solid var(--hairline)" : "none" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-3)" }}>{r.id}</span>
                  <span style={{ fontSize: 13.5, color: "var(--ink)" }}>{r.t}</span>
                  <span className={`pill ${r.status === "expiring" ? "pill-warn" : "pill-warn"}`}>{r.status}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{r.when}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By year */}
          <div className="card" style={{ padding: 22 }}>
            <div className="eyebrow eyebrow-accent">Rules by tax year</div>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              {[["2025", 8, 0.28], ["2026", 18, 0.65], ["2027", 2, 0.07]].map(([y, n, frac]) => (
                <div key={y}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ color: "var(--ink-2)", fontFamily: "var(--mono)" }}>{y}</span>
                    <span className="num" style={{ color: "var(--ink-3)" }}>{n}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--paper-3)", overflow: "hidden" }}>
                    <div style={{ width: `${frac * 100}%`, height: "100%", background: y === "2026" ? "var(--sage-600)" : "var(--sage-300)" }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="dots" style={{ margin: "20px 0" }} />

            <div className="eyebrow eyebrow-accent">Top categories</div>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[["box1", 12], ["aftrekposten", 9], ["box3", 6], ["wet-dba", 4], ["box2", 4], ["heffingskorting", 5], ["zvw", 3], ["loonheffing", 3]].map(([t, n]) => (
                <span key={t} style={{ padding: "4px 10px", borderRadius: 999, background: "var(--paper-3)", fontSize: 12, color: "var(--ink-2)", display: "inline-flex", gap: 6, alignItems: "center" }}>
                  {t} <span style={{ color: "var(--ink-4)" }} className="num">{n}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Activity log */}
        <div className="card" style={{ marginTop: 18, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--hairline)" }}>
            <div className="eyebrow eyebrow-accent">Recent activity</div>
            <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500, marginTop: 4 }}>What changed lately</div>
          </div>
          <div>
            {[
              { t: "anna@taxwijs.nl",   a: "verified", obj: "ZZP-2026-ZELFAFTREK", when: "14 min ago" },
              { t: "ramin@taxwijs.nl",  a: "edited",   obj: "EXP-2026-RULING-Y2",  when: "2 h ago" },
              { t: "system",            a: "reindexed", obj: "all 28 rules",        when: "3 h ago" },
              { t: "anna@taxwijs.nl",   a: "drafted",  obj: "ZZP-2027-KIA",        when: "yesterday" },
            ].map((r, i) => (
              <div key={i} style={{ padding: "12px 22px", display: "grid", gridTemplateColumns: "auto 1fr 1fr auto", gap: 14, fontSize: 13, alignItems: "center", borderTop: i ? "1px solid var(--hairline)" : "none" }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--paper-3)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 600, color: "var(--ink-3)" }}>{r.t.slice(0,1).toUpperCase()}</span>
                <span style={{ color: "var(--ink-2)" }}>{r.t}</span>
                <span><span style={{ color: "var(--ink-3)" }}>{r.a} </span><span className="font-mono" style={{ color: "var(--ink)" }}>{r.obj}</span></span>
                <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{r.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

const RULES = [
  { id: "ZZP-2026-ZELFAFTREK", t: "Zelfstandigenaftrek",            year: 2026, types: ["zzp"],          cat: "aftrek",  status: "verified", upd: "14 min" },
  { id: "ZZP-2026-START",      t: "Startersaftrek (sunset 2026)",   year: 2026, types: ["zzp"],          cat: "aftrek",  status: "expiring", upd: "1 h" },
  { id: "ZZP-2026-MKB",        t: "MKB-winstvrijstelling 12.7%",    year: 2026, types: ["zzp", "dga"],   cat: "box1",    status: "pending",  upd: "2 d" },
  { id: "EMP-2026-IACK",       t: "Inkomensafhankelijke comb.",     year: 2026, types: ["employee"],     cat: "credit",  status: "verified", upd: "5 d" },
  { id: "EMP-2026-AKORT",      t: "Arbeidskorting curve",           year: 2026, types: ["employee","zzp"],cat: "credit",  status: "verified", upd: "1 w" },
  { id: "EXP-2026-RULING-Y2",  t: "30%-ruling year 2",              year: 2026, types: ["expat"],        cat: "ruling",  status: "verified", upd: "2 h" },
  { id: "EXP-2027-STAGE",      t: "Ruling stage-down 2027",         year: 2027, types: ["expat"],        cat: "ruling",  status: "draft",    upd: "yesterday" },
  { id: "DGA-2026-BOX2",       t: "Box 2 progressive ceiling",      year: 2026, types: ["dga"],          cat: "box2",    status: "pending",  upd: "5 d" },
  { id: "ALL-2026-BOX3",       t: "Box 3 fictief rendement",        year: 2026, types: ["all"],          cat: "box3",    status: "verified", upd: "1 w" },
  { id: "ALL-2026-WOZ",        t: "Eigenwoningforfait",             year: 2026, types: ["all"],          cat: "home",    status: "verified", upd: "1 w" },
  { id: "ZZP-2026-DBA",        t: "Wet DBA — single-client risk",   year: 2026, types: ["zzp"],          cat: "compliance",status: "verified", upd: "10 d" },
  { id: "EMP-2026-HK",         t: "Heffingskorting transfer",       year: 2026, types: ["employee","all"],cat: "credit",  status: "verified", upd: "10 d" },
];

const STATUS_PILL = {
  verified: { bg: "var(--ok-soft)",     fg: "var(--ok)",    glyph: "✓ verified" },
  pending:  { bg: "var(--warn-soft)",   fg: "oklch(0.45 0.15 75)", glyph: "• pending" },
  draft:    { bg: "var(--paper-3)",     fg: "var(--ink-3)", glyph: "○ draft" },
  expiring: { bg: "var(--warn-soft)",   fg: "oklch(0.45 0.15 75)", glyph: "⚠ expiring" },
  expired:  { bg: "var(--danger-soft)", fg: "var(--danger)", glyph: "× expired" },
};

function AdminRulesDesktop() {
  const [filter, setFilter] = React.useState("all");
  const rows = filter === "all" ? RULES : RULES.filter(r => r.status === filter);
  return (
    <AdminShell active="rules">
      <div style={{ padding: "28px 32px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
          <div>
            <div className="eyebrow eyebrow-accent">Knowledge base</div>
            <h1 style={{ marginTop: 6, fontFamily: "var(--serif)", fontSize: 36, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              Rules
            </h1>
            <p style={{ marginTop: 4, color: "var(--ink-3)", fontSize: 13.5 }}>Browse, edit, verify and publish all tax rules.</p>
          </div>
          <button className="btn btn-accent">+ New rule</button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, background: "var(--paper-2)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", marginBottom: 14 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)" }}>
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            <input className="input" placeholder="Search ID, topic, tag…" style={{ paddingLeft: 34 }} />
          </div>
          <FilterDropdown label="Year"      value="2026" />
          <FilterDropdown label="User type" value="all" />
          <FilterDropdown label="Category"  value="all" />
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 4 }}>
            {[["all","All"],["verified","Verified"],["pending","Pending"],["draft","Draft"],["expiring","Expiring"]].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{
                padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: "pointer",
                border: "1px solid " + (filter === k ? "transparent" : "var(--hairline)"),
                background: filter === k ? "var(--ink)" : "var(--paper)",
                color: filter === k ? "var(--paper)" : "var(--ink-3)",
              }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 70px 130px 130px 110px 90px", padding: "12px 22px", background: "var(--paper-3)", borderBottom: "1px solid var(--hairline)" }}>
            {["ID","Topic","Year","User types","Status","Updated","Actions"].map(c => (
              <span key={c} className="eyebrow" style={{ textAlign: c === "Actions" ? "right" : "left" }}>{c}</span>
            ))}
          </div>
          {rows.map((r, i) => {
            const p = STATUS_PILL[r.status];
            return (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: "200px 1fr 70px 130px 130px 110px 90px", padding: "13px 22px", borderTop: i ? "1px solid var(--hairline)" : "none", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-3)" }}>{r.id}</span>
                <span style={{ fontSize: 13.5, color: "var(--ink)" }}>{r.t}</span>
                <span className="num" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{r.year}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {r.types.slice(0,3).map(t => (
                    <span key={t} className="eyebrow" style={{ padding: "2px 6px", background: "var(--paper-3)", borderRadius: 4, color: "var(--ink-3)" }}>{t.toUpperCase()}</span>
                  ))}
                </div>
                <span style={{ padding: "3px 8px", borderRadius: 999, background: p.bg, color: p.fg, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.03em", display: "inline-flex", alignSelf: "flex-start" }}>{p.glyph}</span>
                <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{r.upd}</span>
                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                  <button style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid var(--hairline)", background: "var(--paper)", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--ink-3)" }}><Icon.edit /></button>
                  <button style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid var(--hairline)", background: "var(--paper)", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--ink-3)" }}><Icon.chev /></button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Showing {rows.length} of {RULES.length}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="btn btn-ghost btn-sm">← Prev</button>
            <button className="btn btn-ghost btn-sm">Next →</button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function FilterDropdown({ label, value }) {
  return (
    <button style={{ height: 36, padding: "0 12px", border: "1px solid var(--hairline-2)", borderRadius: "var(--r-sm)", background: "var(--paper)", display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: "var(--ink-2)" }}>
      <span style={{ color: "var(--ink-4)" }}>{label}</span>
      <span style={{ color: "var(--ink)" }}>{value}</span>
      <Icon.chev style={{ width: 11, height: 11, transform: "rotate(90deg)" }} />
    </button>
  );
}

Object.assign(window, { AdminDashboardDesktop, AdminRulesDesktop });
