import { useState } from "react";
import { updatePoll } from "../services/pollService";
import toast from "react-hot-toast";

function PollWidget({ poll, onVote, onUpdate, isAuthor }) {
  const [editMode, setEditMode] = useState(false);
  const [editQuestion, setEditQuestion] = useState(poll.question);
  const [editOptions, setEditOptions] = useState(poll.options.map(o => o.text));
  const [saving, setSaving] = useState(false);
  const [isChangingVote, setIsChangingVote] = useState(false);

  const hasVoted = poll.votedOptionId != null;
  const showResults = (hasVoted && !isChangingVote) || poll.expired;
  const canEdit = isAuthor && poll.totalVotes === 0 && !poll.expired;

  const formatExpiry = () => {
    if (poll.expired) return "Sondaggio terminato";
    const diff = new Date(poll.expiresAt) - new Date();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d} giorn${d === 1 ? "o" : "i"} rimanent${d === 1 ? "e" : "i"}`;
    if (h > 0) return `${h} or${h === 1 ? "a" : "e"} rimanent${h === 1 ? "e" : "i"}`;
    return "Meno di 1 ora";
  };

  const handleSaveEdit = async () => {
    const validOpts = editOptions.filter(o => o.trim());
    if (!editQuestion.trim() || validOpts.length < 2) {
      toast.error("Inserisci una domanda e almeno 2 opzioni");
      return;
    }
    setSaving(true);
    const res = await updatePoll(poll.id, { question: editQuestion.trim(), options: validOpts });
    setSaving(false);
    if (res.success) {
      onUpdate(res.data);
      setEditMode(false);
    } else if (res.hasVotes) {
      toast.error("Non puoi modificare un sondaggio con voti");
    } else {
      toast.error("Errore nel salvataggio");
    }
  };

  if (editMode) {
    return (
      <div style={{ padding: "14px 16px", borderTop: "1px solid var(--nx-border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--nx-text)" }}>✏️ Modifica sondaggio</span>
          <button onClick={() => setEditMode(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", fontSize: "18px" }}>✕</button>
        </div>
        <input value={editQuestion} onChange={e => setEditQuestion(e.target.value)} maxLength={300}
          style={{ width: "100%", padding: "8px 12px", background: "var(--nx-input-bg)", border: "1.5px solid var(--nx-input-border)", borderRadius: "var(--nx-radius)", color: "var(--nx-text)", fontSize: "13px", marginBottom: "8px", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
          onFocus={e => e.target.style.borderColor = "#7c3aed"}
          onBlur={e => e.target.style.borderColor = "var(--nx-input-border)"} />
        {editOptions.map((opt, i) => (
          <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "6px", alignItems: "center" }}>
            <input value={opt} onChange={e => setEditOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))} maxLength={150}
              placeholder={`Opzione ${i + 1}`}
              style={{ flex: 1, padding: "7px 12px", background: "var(--nx-input-bg)", border: "1.5px solid var(--nx-input-border)", borderRadius: "var(--nx-radius)", color: "var(--nx-text)", fontSize: "13px", outline: "none", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "var(--nx-input-border)"} />
            {editOptions.length > 2 && (
              <button onClick={() => setEditOptions(prev => prev.filter((_, idx) => idx !== i))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-subtle)", fontSize: "16px" }}>✕</button>
            )}
          </div>
        ))}
        {editOptions.length < 4 && (
          <button onClick={() => setEditOptions(prev => [...prev, ""])}
            style={{ width: "100%", padding: "6px", background: "none", border: "1.5px dashed rgba(124,58,237,0.25)", borderRadius: "var(--nx-radius)", color: "#7c3aed", fontSize: "12px", fontWeight: 600, cursor: "pointer", marginBottom: "10px" }}>
            + Aggiungi opzione
          </button>
        )}
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <button onClick={() => setEditMode(false)}
            style={{ flex: 1, padding: "8px", borderRadius: "var(--nx-radius)", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "var(--nx-text)", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
            Annulla
          </button>
          <button onClick={handleSaveEdit} disabled={saving}
            style={{ flex: 1, padding: "8px", borderRadius: "var(--nx-radius)", background: "var(--nx-grad-btn)", border: "none", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 16px", borderTop: "1px solid var(--nx-border)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
        <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--nx-text)", margin: 0, flex: 1 }}>
          📊 {poll.question}
        </p>
        {canEdit && (
          <button onClick={() => setEditMode(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", padding: "0 0 0 8px", flexShrink: 0 }}
            title="Modifica sondaggio"
            onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-muted)"}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {poll.options.map(opt => (
          <div key={opt.id}>
            {showResults ? (
              <div style={{ position: "relative", borderRadius: "var(--nx-radius)", overflow: "hidden", border: `1.5px solid ${poll.votedOptionId === opt.id ? "#7c3aed" : "var(--nx-border)"}`, background: "var(--nx-surface-2)" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${opt.percentage}%`, background: poll.votedOptionId === opt.id ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.07)", transition: "width 0.5s ease" }} />
                <div style={{ position: "relative", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: poll.votedOptionId === opt.id ? 700 : 400, color: poll.votedOptionId === opt.id ? "#7c3aed" : "var(--nx-text)" }}>
                    {poll.votedOptionId === opt.id && "✓ "}{opt.text}
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--nx-text-muted)" }}>{Math.round(opt.percentage)}%</span>
                </div>
              </div>
            ) : (
              <button onClick={() => { onVote(opt.id); setIsChangingVote(false); }}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--nx-radius)", border: "1.5px solid var(--nx-border)", background: "var(--nx-surface-2)", color: "var(--nx-text)", fontSize: "13px", cursor: "pointer", textAlign: "left", transition: "all var(--nx-transition)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "rgba(124,58,237,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--nx-border)"; e.currentTarget.style.background = "var(--nx-surface-2)"; }}>
                {opt.text}
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
        <p style={{ fontSize: "11px", color: "var(--nx-text-subtle)", margin: 0 }}>
          {poll.totalVotes} vot{poll.totalVotes === 1 ? "o" : "i"} · {formatExpiry()}
        </p>
        {hasVoted && !poll.expired && !isChangingVote && (
          <button
            onClick={() => setIsChangingVote(true)}
            style={{ fontSize: "11px", color: "var(--nx-text-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-subtle)"}>
            Cambia voto
          </button>
        )}
        {isChangingVote && (
          <button
            onClick={() => setIsChangingVote(false)}
            style={{ fontSize: "11px", color: "var(--nx-text-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-subtle)"}>
            Annulla
          </button>
        )}
      </div>
    </div>
  );
}


export default PollWidget;