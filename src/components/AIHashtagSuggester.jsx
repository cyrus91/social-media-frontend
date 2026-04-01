import { useState, useRef, useEffect } from "react";
import { useAI } from "../hooks/useAI";

function AIHashtagSuggester({ content, onHashtagsInsert }) {
  const { loading, suggestHashtags } = useAI();
  const [hashtags, setHashtags] = useState([]);
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleGenerate = async () => {
    if (!content.trim()) return;
    if (open) { setOpen(false); return; }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.top - 8, left: rect.left });
    }
    const result = await suggestHashtags(content);
    if (result?.length > 0) {
      setHashtags(result); setSelected(result); setOpen(true);
    }
  };

  const toggle = (tag) =>
    setSelected(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleInsert = () => {
    if (!selected.length) return;
    onHashtagsInsert(" " + selected.join(" "));
    setOpen(false); setHashtags([]); setSelected([]);
  };

  return (
    <>
      <button ref={btnRef} type="button" onClick={handleGenerate}
        disabled={loading || !content.trim()} title="Suggerisci hashtag con AI"
        style={{
          padding: "5px", borderRadius: "50%",
          background: open ? "rgba(124,58,237,0.12)" : "none",
          border: "none", cursor: loading || !content.trim() ? "not-allowed" : "pointer",
          color: open ? "#7c3aed" : "var(--nx-text-muted)", display: "flex",
          opacity: !content.trim() ? 0.4 : 1, transition: "all var(--nx-transition)",
        }}
        onMouseEnter={e => { if (content.trim() && !loading) { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; } }}>
        {loading
          ? <div style={{ width: "16px", height: "16px", border: "2px solid rgba(124,58,237,0.25)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          : <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
        }
      </button>

      {open && hashtags.length > 0 && (
        <div ref={popoverRef} style={{
          position: "fixed", top: coords.top, left: coords.left,
          transform: "translateY(-100%) translateY(-6px)",
          zIndex: 9999,
          background: "var(--nx-surface)", border: "1px solid var(--nx-border)",
          borderRadius: "var(--nx-radius-lg)", boxShadow: "var(--nx-shadow-lg)",
          padding: "12px 14px", width: "280px",
        }}>
          <div style={{ position: "absolute", bottom: "-5px", left: "20px", width: "10px", height: "10px", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderTop: "none", borderLeft: "none", transform: "rotate(45deg)" }} />
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", marginBottom: "8px" }}>✦ Hashtag suggeriti</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
            {hashtags.map(tag => (
              <button key={tag} type="button" onClick={() => toggle(tag)}
                style={{
                  fontSize: "11px", padding: "3px 10px", borderRadius: "var(--nx-radius-full)", fontWeight: 600,
                  cursor: "pointer", transition: "all var(--nx-transition)",
                  background: selected.includes(tag) ? "var(--nx-grad-btn)" : "rgba(124,58,237,0.08)",
                  color: selected.includes(tag) ? "#fff" : "#7c3aed",
                  border: selected.includes(tag) ? "none" : "1px solid rgba(124,58,237,0.2)",
                }}>
                {tag}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button type="button" onClick={handleInsert} disabled={!selected.length}
              style={{ padding: "5px 14px", fontSize: "12px", fontWeight: 600, background: "var(--nx-grad-btn)", color: "#fff", border: "none", borderRadius: "var(--nx-radius-full)", cursor: !selected.length ? "not-allowed" : "pointer", opacity: !selected.length ? 0.5 : 1 }}>
              Aggiungi
            </button>
            <button type="button" onClick={() => { setOpen(false); setHashtags([]); setSelected([]); }}
              style={{ fontSize: "12px", color: "var(--nx-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
              Annulla
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AIHashtagSuggester;