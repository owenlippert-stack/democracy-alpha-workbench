import React, { useState, useMemo, useEffect } from "react";
/* ------------------------------------------------------------------ */
/* Democracy Alpha — question workbench (v2.2, rules of 2026-08-11) */
/* Opposition International · contest, not contestant */
/* */
/* v2.1→v2.2: tie detection (top two weights within 2 points state a */
/* tie instead of claiming a leader); always-visible channel menu */
/* with one-tap combinations and renormalized readout; question */
/* preset chips. v2→v2.1: amended Tin Man doctrine; session-only */
/* research-mode toggle with watermark; classic-style prose rule. */
/* Storage key unchanged — a saved register reloads on launch. */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "democracy-alpha-register-v2";

const CHANNELS = [
  { id: "scarecrow", label: "Scarecrow", emoji: "🌾", desc: "Institutional rules & legal frameworks" },
  { id: "tinman", label: "Tin Man", emoji: "⚙️", desc: "Administrative capacity & bureaucratic machinery" },
  { id: "lion", label: "Lion", emoji: "🦁", desc: "Political will & leadership courage" },
  { id: "dorothy", label: "Dorothy", emoji: "👟", desc: "Grassroots mobilization & civic agency" }
];

const QUESTION_PRESETS = [
  { label: "Opposition viability", weights: { scarecrow: 30, tinman: 25, lion: 25, dorothy: 20 }, question: "Can the opposition win a fair election?" },
  { label: "Electoral integrity", weights: { scarecrow: 40, tinman: 30, lion: 15, dorothy: 15 }, question: "Will the election be free and fair?" },
  { label: "Authoritarian resilience", weights: { scarecrow: 20, tinman: 35, lion: 25, dorothy: 20 }, question: "How durable is the incumbent regime?" },
  { label: "Protest potential", weights: { scarecrow: 15, tinman: 20, lion: 25, dorothy: 40 }, question: "Will mass mobilization occur?" },
  { label: "Institutional reform", weights: { scarecrow: 35, tinman: 30, lion: 20, dorothy: 15 }, question: "Can institutions be strengthened?" }
];

const TIE_THRESHOLD = 2;
const RESEARCH_MODE_KEY = "democracy-alpha-research-mode";

export default function Workbench() {
  const [register, setRegister] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [researchMode, setResearchMode] = useState(() => {
    try {
      return sessionStorage.getItem(RESEARCH_MODE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [activeQuestion, setActiveQuestion] = useState("");
  const [weights, setWeights] = useState({ scarecrow: 25, tinman: 25, lion: 25, dorothy: 25 });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(register));
  }, [register]);

  useEffect(() => {
    sessionStorage.setItem(RESEARCH_MODE_KEY, researchMode.toString());
  }, [researchMode]);

  const totalWeight = useMemo(() => Object.values(weights).reduce((a, b) => a + b, 0), [weights]);

  const normalizedWeights = useMemo(() => {
    if (totalWeight === 0) return { scarecrow: 25, tinman: 25, lion: 25, dorothy: 25 };
    return Object.fromEntries(
      Object.entries(weights).map(([k, v]) => [k, Math.round((v / totalWeight) * 100)])
    );
  }, [weights, totalWeight]);

  const sortedChannels = useMemo(() => {
    return CHANNELS.map(c => ({ ...c, weight: normalizedWeights[c.id] }))
      .sort((a, b) => b.weight - a.weight);
  }, [normalizedWeights]);

  const tieDetected = useMemo(() => {
    if (sortedChannels.length < 2) return false;
    return sortedChannels[0].weight - sortedChannels[1].weight <= TIE_THRESHOLD;
  }, [sortedChannels]);

  const leader = tieDetected ? null : sortedChannels[0];

  const handleWeightChange = (channelId, delta) => {
    setWeights(prev => {
      const next = { ...prev };
      next[channelId] = Math.max(0, next[channelId] + delta);
      return next;
    });
  };

  const applyPreset = (preset) => {
    setWeights(preset.weights);
    setActiveQuestion(preset.question);
  };

  const saveEntry = () => {
    if (!activeQuestion.trim()) return;
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      question: activeQuestion,
      weights: { ...normalizedWeights },
      tie: tieDetected,
      leader: leader?.id,
      notes,
      researchMode
    };
    setRegister(prev => [entry, ...prev]);
    setActiveQuestion("");
    setNotes("");
    setWeights({ scarecrow: 25, tinman: 25, lion: 25, dorothy: 25 });
  };

  const deleteEntry = (id) => {
    setRegister(prev => prev.filter(e => e.id !== id));
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(register, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `democracy-alpha-register-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <header style={{ marginBottom: "24px", borderBottom: "1px solid #e5e5e5", paddingBottom: "16px" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Democracy Alpha — Question Workbench</h1>
        <p style={{ margin: "8px 0 0", color: "#666", fontSize: "0.9rem" }}>
          v2.2 · rules of 2026-08-11 · Opposition International · <em>contest, not contestant</em>
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", fontSize: "0.85rem" }}>
          <input
            type="checkbox"
            checked={researchMode}
            onChange={e => setResearchMode(e.target.checked)}
          />
          Research mode (session-only, watermarked exports)
        </label>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Question</h2>
          <textarea
            value={activeQuestion}
            onChange={e => setActiveQuestion(e.target.value)}
            placeholder="Enter your analytical question…"
            style={{ width: "100%", minHeight: "80px", padding: "10px", fontFamily: "inherit", fontSize: "0.95rem", border: "1px solid #ddd", borderRadius: "6px", resize: "vertical" }}
          />
          <div style={{ marginTop: "12px" }}>
            <label style={{ fontSize: "0.85rem", color: "#666" }}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Context, evidence, caveats…"
              style={{ width: "100%", minHeight: "60px", padding: "10px", fontFamily: "inherit", fontSize: "0.9rem", border: "1px solid #ddd", borderRadius: "6px", resize: "vertical", marginTop: "4px" }}
            />
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Channel Weights</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {QUESTION_PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => applyPreset(preset)}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                  border: "1px solid #ddd",
                  borderRadius: "999px",
                  background: "white",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
                title={preset.question}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {CHANNELS.map(ch => (
            <div key={ch.id} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "1.1rem" }}>{ch.emoji}</span>
                  <strong>{ch.label}</strong>
                </span>
                <span style={{ fontSize: "1.25rem", fontWeight: 600 }}>{normalizedWeights[ch.id]}%</span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights[ch.id]}
                  onChange={e => setWeights(prev => ({ ...prev, [ch.id]: Number(e.target.value) }))}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => handleWeightChange(ch.id, -5)}
                  style={{ padding: "4px 10px", fontSize: "0.85rem" }}
                >
                  −5
                </button>
                <button
                  onClick={() => handleWeightChange(ch.id, 5)}
                  style={{ padding: "4px 10px", fontSize: "0.85rem" }}
                >
                  +5
                </button>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#888" }}>{ch.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "24px", padding: "16px", background: researchMode ? "#fffbe6" : "#fafafa", border: "1px solid #e5e5e5", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          Readout
          {researchMode && <span style={{ fontSize: "0.7rem", background: "#ffc107", padding: "2px 6px", borderRadius: "4px" }}>RESEARCH MODE</span>}
          {tieDetected && <span style={{ fontSize: "0.7rem", background: "#ff9800", color: "white", padding: "2px 6px", borderRadius: "4px" }}>TIE</span>}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
          {sortedChannels.map((ch, i) => (
            <div
              key={ch.id}
              style={{
                padding: "12px",
                background: "white",
                borderRadius: "6px",
                border: ch.id === leader?.id ? "2px solid #1976d2" : tieDetected && i < 2 ? "2px solid #ff9800" : "1px solid #e5e5e5",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "1.5rem" }}>{ch.emoji}</div>
              <div style={{ fontWeight: 600 }}>{ch.label}</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: ch.id === leader?.id ? "#1976d2" : tieDetected && i < 2 ? "#ff9800" : "#333" }}>
                {normalizedWeights[ch.id]}%
              </div>
              {ch.id === leader?.id && !tieDetected && <div style={{ fontSize: "0.7rem", color: "#1976d2", marginTop: "4px" }}>LEADER</div>}
              {tieDetected && i < 2 && <div style={{ fontSize: "0.7rem", color: "#ff9800", marginTop: "4px" }}>TIED</div>}
            </div>
          ))}
        </div>
        {tieDetected && (
          <p style={{ margin: "12px 0 0", fontSize: "0.85rem", color: "#e65100" }}>
            ⚠ Top two channels within {TIE_THRESHOLD} points — no single leader. Tie recorded in register.
          </p>
        )}
        {!tieDetected && leader && (
          <p style={{ margin: "12px 0 0", fontSize: "0.85rem", color: "#1976d2" }}>
            → Leading channel: <strong>{leader.label} {leader.emoji}</strong> at <strong>{normalizedWeights[leader.id]}%</strong>
          </p>
        )}
        <p style={{ margin: "12px 0 0", fontSize: "0.85rem", color: "#666" }}>
          Weights renormalize to 100% on every change. Raw sliders store absolute values; readout shows percentages.
        </p>
      </section>

      <section style={{ marginBottom: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button onClick={saveEntry} disabled={!activeQuestion.trim()} style={{
          padding: "10px 20px",
          fontSize: "0.95rem",
          fontWeight: 600,
          background: activeQuestion.trim() ? "#1976d2" : "#ccc",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: activeQuestion.trim() ? "pointer" : "not-allowed"
        }}>
          Save to Register
        </button>
        <button onClick={exportJSON} style={{
          padding: "10px 20px",
          fontSize: "0.95rem",
          background: "white",
          color: "#1976d2",
          border: "1px solid #1976d2",
          borderRadius: "6px",
          cursor: "pointer"
        }}>
          Export Register (JSON)
        </button>
        {researchMode && (
          <span style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: "0.8rem", color: "#ff8f00" }}>
            ⚠ Research mode: entries marked, not for production use
          </span>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Register ({register.length} entries)</h2>
        {register.length === 0 ? (
          <p style={{ color: "#888", fontSize: "0.9rem" }}>No entries yet. Save your first analysis above.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {register.slice().reverse().map(entry => (
              <div
                key={entry.id}
                style={{
                  padding: "12px",
                  background: entry.researchMode ? "#fffbe6" : "white",
                  border: "1px solid #e5e5e5",
                  borderRadius: "6px",
                  borderLeft: entry.researchMode ? "4px solid #ffc107" : "4px solid #1976d2"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 600 }}>{entry.question}</span>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.75rem" }}>
                    {entry.researchMode && <span style={{ background: "#ffc107", padding: "1px 6px", borderRadius: "3px" }}>RESEARCH</span>}
                    {entry.tie && <span style={{ background: "#ff9800", color: "white", padding: "1px 6px", borderRadius: "3px" }}>TIE</span>}
                    {!entry.tie && entry.leader && <span style={{ background: "#1976d2", color: "white", padding: "1px 6px", borderRadius: "3px" }}>{CHANNELS.find(c => c.id === entry.leader)?.label}</span>}
                    <span style={{ color: "#888" }}>{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "16px", fontSize: "0.8rem", color: "#555", flexWrap: "wrap" }}>
                  {CHANNELS.map(ch => (
                    <span key={ch.id}>{ch.emoji} {ch.label}: {entry.weights[ch.id]}%</span>
                  ))}
                </div>
                {entry.notes && (
                  <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "#666", fontStyle: "italic" }}>{entry.notes}</p>
                )}
                <button
                  onClick={() => deleteEntry(entry.id)}
                  style={{ marginTop: "8px", padding: "4px 10px", fontSize: "0.75rem", background: "transparent", border: "1px solid #ff5252", color: "#ff5252", borderRadius: "4px", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #e5e5e5", fontSize: "0.8rem", color: "#888" }}>
        <p>Democracy Alpha Workbench v2.2 · Opposition International · <a href="https://opposition.international" target="_blank" rel="noopener" style={{ color: "#1976d2" }}>opposition.international</a></p>
        <p>Storage key: <code>{STORAGE_KEY}</code> · Research mode key: <code>{RESEARCH_MODE_KEY}</code> (sessionStorage)</p>
      </footer>
    </div>
  );
}
