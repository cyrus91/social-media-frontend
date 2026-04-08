import { useState } from "react";
import { reportPost } from "../services/reportService";
import toast from "react-hot-toast";

const REASONS = [
  { value: "SPAM", label: "Spam", icon: "🚫" },
  { value: "HATE_SPEECH", label: "Incitamento all'odio", icon: "⚠️" },
  { value: "VIOLENCE", label: "Violenza", icon: "🔴" },
  { value: "NUDITY", label: "Contenuto inappropriato", icon: "🔞" },
  { value: "FALSE_INFORMATION", label: "Informazioni false", icon: "❌" },
  { value: "HARASSMENT", label: "Molestie", icon: "😡" },
  { value: "OTHER", label: "Altro", icon: "💬" },
];

export default function ReportModal({ postId, onClose }) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { toast.error("Seleziona un motivo"); return; }
    setLoading(true);
    const res = await reportPost(postId, reason, notes);
    setLoading(false);
    if (res.alreadyReported) {
      toast.error("Hai già segnalato questo post");
    } else if (res.success) {
      toast.success("Segnalazione inviata. La esamineremo a breve.");
      onClose();
    } else {
      toast.error("Errore nell'invio della segnalazione");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)"
    }} onClick={onClose}>
      <div style={{
        background: "var(--nx-surface)", border: "1px solid var(--nx-border)",
        borderRadius: "var(--nx-radius-lg)", padding: "24px",
        width: "min(420px, 92vw)", maxHeight: "90vh", overflowY: "auto"
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--nx-text)" }}>Segnala post</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", fontSize: "20px", lineHeight: 1 }}>✕</button>
        </div>

        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--nx-text-muted)" }}>
          Seleziona il motivo della segnalazione. Esamineremo il contenuto il prima possibile.
        </p>

        {/* Motivi */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          {REASONS.map(r => (
            <button key={r.value} onClick={() => setReason(r.value)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 14px", borderRadius: "var(--nx-radius)",
                border: `1.5px solid ${reason === r.value ? "#7c3aed" : "var(--nx-border)"}`,
                background: reason === r.value ? "rgba(124,58,237,0.08)" : "var(--nx-surface-2)",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s"
              }}>
              <span style={{ fontSize: "16px" }}>{r.icon}</span>
              <span style={{ fontSize: "14px", fontWeight: reason === r.value ? 600 : 400, color: reason === r.value ? "#7c3aed" : "var(--nx-text)" }}>
                {r.label}
              </span>
              {reason === r.value && (
                <svg style={{ marginLeft: "auto" }} width="16" height="16" fill="#7c3aed" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" stroke="#7c3aed" fill="none"/>
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Note aggiuntive (opzionale) */}
        {reason === "OTHER" && (
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Descrivi il problema..."
            maxLength={500}
            style={{
              width: "100%", minHeight: "80px", padding: "10px 12px",
              background: "var(--nx-input-bg)", border: "1.5px solid var(--nx-input-border)",
              borderRadius: "var(--nx-radius)", color: "var(--nx-text)",
              fontSize: "14px", resize: "vertical", boxSizing: "border-box",
              marginBottom: "16px", outline: "none", fontFamily: "inherit"
            }}
          />
        )}

        {/* Bottoni */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "10px", borderRadius: "var(--nx-radius)", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "var(--nx-text)", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
            Annulla
          </button>
          <button onClick={handleSubmit} disabled={!reason || loading}
            style={{ flex: 1, padding: "10px", borderRadius: "var(--nx-radius)", background: !reason || loading ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.85)", border: "none", color: "#fff", fontWeight: 600, fontSize: "14px", cursor: !reason || loading ? "not-allowed" : "pointer" }}>
            {loading ? "Invio..." : "Invia segnalazione"}
          </button>
        </div>
      </div>
    </div>
  );
}