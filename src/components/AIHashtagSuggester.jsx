import { useState } from "react";
import { useAI } from "../hooks/useAI";

function AIHashtagSuggester({ content, onHashtagsInsert }) {
  const { loading, suggestHashtags } = useAI();
  const [hashtags, setHashtags] = useState([]);
  const [selected, setSelected] = useState([]);
  const [shown, setShown] = useState(false);

  const handleGenerate = async () => {
    if (!content.trim()) return;
    const result = await suggestHashtags(content);
    if (result?.length > 0) { setHashtags(result); setSelected(result); setShown(true); }
  };

  const toggleHashtag = (tag) =>
    setSelected(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleInsert = () => {
    if (selected.length === 0) return;
    onHashtagsInsert(" " + selected.join(" "));
    setShown(false); setHashtags([]); setSelected([]);
  };

  return (
    <div>
      <button type="button" onClick={handleGenerate} disabled={loading || !content.trim()}
        title="Suggerisci hashtag con AI"
        style={{ padding: "5px", borderRadius: "50%", background: "none", border: "none", cursor: loading || !content.trim() ? "not-allowed" : "pointer", color: "var(--nx-text-muted)", display: "flex", opacity: !content.trim() ? 0.4 : 1, transition: "all var(--nx-transition)" }}
        onMouseEnter={e => { if (content.trim() && !loading) { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; } }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
        {loading ? (
          <div style={{ width: "18px", height: "18px", border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        ) : (
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        )}
      </button>

      {shown && hashtags.length > 0 && (
        <div style={{ marginTop: "8px", padding: "12px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "var(--nx-radius-lg)" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", marginBottom: "8px" }}>
            ✨ Hashtag suggeriti — seleziona quelli che vuoi:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
            {hashtags.map(tag => (
              <button key={tag} type="button" onClick={() => toggleHashtag(tag)}
                style={{
                  fontSize: "12px", padding: "3px 12px", borderRadius: "var(--nx-radius-full)", fontWeight: 600,
                  background: selected.includes(tag) ? "var(--nx-grad-btn)" : "rgba(124,58,237,0.08)",
                  color: selected.includes(tag) ? "#fff" : "#7c3aed",
                  border: selected.includes(tag) ? "none" : "1px solid rgba(124,58,237,0.25)",
                  cursor: "pointer", transition: "all var(--nx-transition)",
                }}>
                {tag}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button type="button" onClick={handleInsert} disabled={selected.length === 0}
              style={{ padding: "5px 14px", fontSize: "12px", fontWeight: 600, background: "var(--nx-grad-btn)", color: "#fff", border: "none", borderRadius: "var(--nx-radius-full)", cursor: selected.length === 0 ? "not-allowed" : "pointer", opacity: selected.length === 0 ? 0.5 : 1 }}>
              Aggiungi al testo
            </button>
            <button type="button" onClick={() => { setShown(false); setHashtags([]); setSelected([]); }}
              style={{ fontSize: "12px", color: "var(--nx-text-muted)", background: "none", border: "none", cursor: "pointer" }}>
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIHashtagSuggester;