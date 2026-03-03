import { useState, useEffect } from "react";

const PROTOCOLS = ["Aave", "Lido", "Pendle", "Ethena", "Curve"];

const TAGS = [
  { id: "protocoles", label: "🔵 Protocoles DeFi", color: "#4fc3f7" },
  { id: "regulation", label: "🟢 Régulation & MiCA", color: "#43e97b" },
  { id: "risques", label: "🔴 Risques & Hacks", color: "#f64f59" },
  { id: "marche", label: "🟠 Marchés & APY", color: "#f7971e" },
];

const IMPACT_CONFIG = {
  fort: { label: "⚠️ Fort", bg: "rgba(246,79,89,0.15)", color: "#f64f59", border: "rgba(246,79,89,0.3)" },
  moyen: { label: "~ Moyen", bg: "rgba(247,151,30,0.15)", color: "#f7971e", border: "rgba(247,151,30,0.3)" },
  faible: { label: "✓ Faible", bg: "rgba(67,233,123,0.15)", color: "#43e97b", border: "rgba(67,233,123,0.3)" },
  neutre: { label: "— Neutre", bg: "rgba(123,154,184,0.1)", color: "#7b9ab8", border: "rgba(123,154,184,0.2)" },
};

const SECTIONS = [
  { key: "regulation", icon: "🟢", label: "Réglementaire & Fiscal", color: "#43e97b" },
  { key: "protocoles", icon: "🔵", label: "Protocoles ClariFi", color: "#4fc3f7" },
  { key: "risques", icon: "🔴", label: "Risques & Incidents", color: "#f64f59" },
  { key: "marche", icon: "🟠", label: "Marchés & Rendements", color: "#f7971e" },
];

export default function ClariFiVeille() {
  const [activeTags, setActiveTags] = useState(["protocoles", "regulation", "risques", "marche"]);
  const [period, setPeriod] = useState("7");
  const [profile, setProfile] = useState("all");
  const [language, setLanguage] = useState("fr");
  const [loading, setLoading] = useState(false);
  const [digest, setDigest] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  }, []);

  const toggleTag = (id) => {
    setActiveTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const generateDigest = async () => {
    if (activeTags.length === 0) { setError("Sélectionne au moins un thème."); return; }
    setLoading(true);
    setError("");
    setDigest(null);

    const systemPrompt = `Tu es l'agent de veille de ClariFi, un outil d'aide à la décision pour investisseurs non-techniciens en DeFi.
ClariFi suit 5 protocoles : Aave (lending, 29/40), Lido (liquid staking, 29/40), Pendle (yield tokenisation, 23/40), Ethena (delta-neutre, 18/40), Curve (AMM, 14/40).
Tu réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks.`;

    const userPrompt = `Génère un digest de veille DeFi complet pour le ${today}.
Période : ${period} jours. Profil : ${profile}. Thèmes : ${activeTags.join(", ")}.
Langue : ${language === "fr" ? "français" : "anglais"}.

Réponds avec ce JSON exact :
{
  "resume_executif": "2-3 phrases résumant les faits les plus importants",
  "regulation": { "titre": "titre court", "faits": ["fait 1", "fait 2", "fait 3"], "analyse": "analyse 2 phrases" },
  "protocoles": { "titre": "titre court", "faits": ["fait Aave", "fait Lido", "fait Pendle/Ethena/Curve"], "analyse": "analyse 2 phrases" },
  "risques": { "titre": "titre court", "faits": ["risque 1", "risque 2"], "analyse": "analyse 2 phrases" },
  "marche": { "titre": "titre court", "faits": ["tendance APY", "tendance TVL", "autre"], "analyse": "analyse 2 phrases" },
  "impact_clarifi": {
    "aave": {"niveau": "faible|moyen|fort|neutre", "note": "note courte"},
    "lido": {"niveau": "faible|moyen|fort|neutre", "note": "note courte"},
    "pendle": {"niveau": "faible|moyen|fort|neutre", "note": "note courte"},
    "ethena": {"niveau": "faible|moyen|fort|neutre", "note": "note courte"},
    "curve": {"niveau": "faible|moyen|fort|neutre", "note": "note courte"}
  },
  "action_recommandee": "une action concrète pour l'investisseur cette semaine"
}`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      const data = await response.json();
      const raw = data.content?.[0]?.text || "";
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setDigest(parsed);
    } catch (err) {
      setError("Erreur lors de la génération. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  const copyDigest = () => {
    if (!digest) return;
    const text = `DIGEST CLARIFI — ${today}\n\n${digest.resume_executif}\n\n` +
      SECTIONS.map(s => `${s.label.toUpperCase()}\n${digest[s.key]?.faits?.join("\n")}\n${digest[s.key]?.analyse}`).join("\n\n") +
      `\n\nACTION RECOMMANDÉE\n${digest.action_recommandee}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const styles = {
    wrapper: { background: "#0d1b2a", minHeight: "100vh", color: "#e8f0fe", fontFamily: "'DM Sans', system-ui, sans-serif", padding: "0 0 60px" },
    header: { padding: "40px 40px 28px", borderBottom: "1px solid rgba(79,195,247,0.12)", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" },
    logo: { fontSize: "38px", fontWeight: 800, background: "linear-gradient(135deg, #4fc3f7, #82c4f5, #e8f0fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-1px", lineHeight: 1 },
    tagline: { fontSize: "12px", color: "#7b9ab8", marginTop: "6px", fontWeight: 300 },
    badge: { padding: "4px 12px", borderRadius: "20px", fontSize: "11px", color: "#4fc3f7", border: "1px solid rgba(79,195,247,0.2)", background: "rgba(79,195,247,0.08)", fontWeight: 600, letterSpacing: "1px" },
    date: { fontSize: "12px", color: "#7b9ab8", marginTop: "6px", textAlign: "right" },
    container: { maxWidth: "1000px", margin: "0 auto", padding: "0 24px" },
    card: { background: "#111d2e", border: "1px solid rgba(79,195,247,0.12)", borderRadius: "16px", padding: "28px 32px", marginBottom: "24px", position: "relative", overflow: "hidden" },
    cardLine: { position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #4fc3f7, transparent)" },
    cardTitle: { fontSize: "17px", fontWeight: 700, marginBottom: "20px", color: "#e8f0fe" },
    label: { display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#7b9ab8", marginBottom: "8px", fontWeight: 600 },
    select: { width: "100%", background: "#1e2f45", border: "1px solid rgba(79,195,247,0.12)", borderRadius: "8px", padding: "10px 14px", color: "#e8f0fe", fontSize: "13px", outline: "none", appearance: "none" },
    filtersGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" },
    tagsRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" },
    generateBtn: { width: "100%", padding: "16px", background: "linear-gradient(135deg, #1a3a5c, #2e6da4)", border: "1px solid rgba(79,195,247,0.3)", borderRadius: "10px", color: "#e8f0fe", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, letterSpacing: "0.5px" },
    error: { marginTop: "14px", padding: "12px 16px", background: "rgba(246,79,89,0.08)", border: "1px solid rgba(246,79,89,0.2)", borderRadius: "8px", color: "#f64f59", fontSize: "13px" },
    digestHeader: { background: "#111d2e", border: "1px solid rgba(79,195,247,0.12)", borderRadius: "16px 16px 0 0", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "none" },
    digestTitle: { fontSize: "20px", fontWeight: 800 },
    digestBody: { background: "#111d2e", border: "1px solid rgba(79,195,247,0.12)", borderTop: "1px solid rgba(79,195,247,0.12)", borderRadius: "0 0 16px 16px", overflow: "hidden" },
    section: { padding: "24px 32px", borderBottom: "1px solid rgba(79,195,247,0.08)" },
    sectionLabel: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" },
    sectionIcon: { width: "30px", height: "30px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 },
    sectionTitle: { fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" },
    content: { fontSize: "14px", lineHeight: 1.8, fontWeight: 300 },
    factItem: { padding: "7px 0 7px 18px", position: "relative", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "14px" },
    analyse: { marginTop: "12px", color: "#7b9ab8", fontStyle: "italic", fontSize: "13px" },
    impactGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginTop: "14px" },
    impactCard: { background: "#1e2f45", border: "1px solid rgba(79,195,247,0.12)", borderRadius: "10px", padding: "12px", textAlign: "center" },
    actionBar: { display: "flex", gap: "12px", marginTop: "16px" },
    copyBtn: { padding: "10px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", background: "rgba(79,195,247,0.08)", color: "#4fc3f7", border: "1px solid rgba(79,195,247,0.3)" },
    resetBtn: { padding: "10px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", background: "transparent", color: "#7b9ab8", border: "1px solid rgba(79,195,247,0.12)" },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <div style={styles.logo}>ClariFi</div>
          <div style={styles.tagline}>Agent de Veille DeFi — Certification Alyra RS6675</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={styles.badge}>⚡ POWERED BY CLAUDE AI</span>
          <div style={styles.date}>{today}</div>
        </div>
      </div>

      <div style={styles.container}>
        {/* Control Panel */}
        <div style={styles.card}>
          <div style={styles.cardLine} />
          <div style={styles.cardTitle}>Générer mon digest de veille</div>

          <div style={styles.filtersGrid}>
            {[
              { label: "Période analysée", id: "period", value: period, setter: setPeriod, options: [["7", "7 derniers jours"], ["14", "14 derniers jours"], ["30", "30 derniers jours"]] },
              { label: "Profil investisseur", id: "profile", value: profile, setter: setProfile, options: [["all", "Tous les profils"], ["conservateur", "Conservateur"], ["modere", "Modéré"], ["agressif", "Agressif"]] },
              { label: "Langue", id: "language", value: language, setter: setLanguage, options: [["fr", "Français"], ["en", "English"]] },
            ].map(f => (
              <div key={f.id}>
                <label style={styles.label}>{f.label}</label>
                <select style={styles.select} value={f.value} onChange={e => f.setter(e.target.value)}>
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>

          <label style={styles.label}>Thèmes à surveiller</label>
          <div style={styles.tagsRow}>
            {TAGS.map(tag => (
              <span key={tag.id} onClick={() => toggleTag(tag.id)} style={{
                padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                border: `1px solid ${activeTags.includes(tag.id) ? tag.color + "60" : "rgba(255,255,255,0.1)"}`,
                color: activeTags.includes(tag.id) ? tag.color : "#7b9ab8",
                background: activeTags.includes(tag.id) ? tag.color + "15" : "transparent",
                opacity: activeTags.includes(tag.id) ? 1 : 0.5,
                transition: "all 0.2s",
              }}>{tag.label}</span>
            ))}
          </div>

          <button style={styles.generateBtn} onClick={generateDigest} disabled={loading}>
            {loading ? "⏳ Analyse en cours..." : "⚡ Générer le digest de veille ClariFi"}
          </button>

          {error && <div style={styles.error}>{error}</div>}
        </div>

        {/* Digest */}
        {digest && (
          <div>
            <div style={styles.digestHeader}>
              <div style={styles.digestTitle}>📊 Digest ClariFi</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "11px", color: "#4fc3f7", background: "rgba(79,195,247,0.08)", border: "1px solid rgba(79,195,247,0.2)", fontWeight: 600 }}>📅 {today}</span>
                <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "11px", color: "#43e97b", background: "rgba(67,233,123,0.08)", border: "1px solid rgba(67,233,123,0.2)", fontWeight: 600 }}>Claude AI</span>
              </div>
            </div>

            <div style={styles.digestBody}>
              {/* Résumé */}
              <div style={styles.section}>
                <div style={styles.sectionLabel}>
                  <div style={{ ...styles.sectionIcon, background: "rgba(79,195,247,0.12)" }}>📋</div>
                  <span style={{ ...styles.sectionTitle, color: "#e8f0fe" }}>Résumé exécutif</span>
                </div>
                <div style={styles.content}>{digest.resume_executif}</div>
              </div>

              {/* Sections */}
              {SECTIONS.map(s => {
                const data = digest[s.key];
                if (!data) return null;
                return (
                  <div key={s.key} style={styles.section}>
                    <div style={styles.sectionLabel}>
                      <div style={{ ...styles.sectionIcon, background: s.color + "20" }}>{s.icon}</div>
                      <span style={{ ...styles.sectionTitle, color: s.color }}>{s.label} — {data.titre}</span>
                    </div>
                    <div>
                      {data.faits?.map((f, i) => (
                        <div key={i} style={styles.factItem}>
                          <span style={{ position: "absolute", left: 0, color: "#4fc3f7", fontSize: "12px" }}>→</span>
                          {f}
                        </div>
                      ))}
                      <div style={styles.analyse}>{data.analyse}</div>
                    </div>
                  </div>
                );
              })}

              {/* Impact */}
              {digest.impact_clarifi && (
                <div style={styles.section}>
                  <div style={styles.sectionLabel}>
                    <div style={{ ...styles.sectionIcon, background: "rgba(46,109,164,0.2)" }}>📊</div>
                    <span style={{ ...styles.sectionTitle, color: "#2e6da4" }}>Impact sur le scoring ClariFi</span>
                  </div>
                  <div style={styles.impactGrid}>
                    {PROTOCOLS.map(p => {
                      const key = p.toLowerCase();
                      const d = digest.impact_clarifi[key] || { niveau: "neutre", note: "" };
                      const cfg = IMPACT_CONFIG[d.niveau] || IMPACT_CONFIG.neutre;
                      return (
                        <div key={p} style={styles.impactCard}>
                          <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px" }}>{p}</div>
                          <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                          <div style={{ fontSize: "10px", color: "#7b9ab8", marginTop: "6px", lineHeight: 1.4 }}>{d.note}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action */}
              {digest.action_recommandee && (
                <div style={{ ...styles.section, background: "rgba(79,195,247,0.04)", borderBottom: "none" }}>
                  <div style={styles.sectionLabel}>
                    <div style={{ ...styles.sectionIcon, background: "rgba(79,195,247,0.15)" }}>⚡</div>
                    <span style={{ ...styles.sectionTitle, color: "#4fc3f7" }}>Action recommandée cette semaine</span>
                  </div>
                  <div style={{ ...styles.content, fontSize: "15px" }}>{digest.action_recommandee}</div>
                </div>
              )}
            </div>

            <div style={styles.actionBar}>
              <button style={styles.copyBtn} onClick={copyDigest}>{copied ? "✅ Copié !" : "📋 Copier le digest"}</button>
              <button style={styles.resetBtn} onClick={() => setDigest(null)}>↺ Nouveau digest</button>
            </div>
          </div>
        )}

        <div style={{ marginTop: "48px", paddingTop: "20px", borderTop: "1px solid rgba(79,195,247,0.12)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", color: "#7b9ab8" }}>ClariFi — Projet individuel Alyra RS6675 — Mars 2026</span>
          <span style={{ fontSize: "14px", fontWeight: 700, background: "linear-gradient(135deg, #4fc3f7, #e8f0fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ClariFi</span>
        </div>
      </div>
    </div>
  );
}
