import { useState } from "react";
import { useAI } from "../hooks/useAI";
import { aiService } from "../services/aiService";

/**
 * Ridimensiona e comprime un'immagine base64.
 * maxSize: larghezza/altezza massima in px
 * quality: 0-1 (JPEG quality)
 * Restituisce il base64 senza prefisso data:...
 */
function compressImage(dataUrl, maxSize = 512, quality = 0.6) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      // Rimuove il prefisso data:image/...;base64,
      const compressed = canvas.toDataURL("image/jpeg", quality).split(",")[1];
      resolve(compressed);
    };
    img.onerror = () => {
      // Fallback: ritorna il base64 originale senza prefisso
      resolve(dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl);
    };
    img.src = dataUrl;
  });
}

function AICaptionGenerator({ onCaptionGenerated, imageUrls = [] }) {
  const { generateCaption } = useAI();
  const [tone, setTone] = useState("friendly");
  const [suggestion, setSuggestion] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [loading, setLoading] = useState(false);

  const tones = [
    { value: "friendly", label: "Amichevole", emoji: "😊" },
    { value: "professional", label: "Professionale", emoji: "💼" },
    { value: "funny", label: "Divertente", emoji: "😄" },
    { value: "inspirational", label: "Ispirazionale", emoji: "✨" },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let caption;
      if (imageUrls && imageUrls.length > 0) {
        // Ridimensiona le immagini prima di mandarle — Groq ha limite token
        const compressedImages = await Promise.all(
          imageUrls.slice(0, 2).map(dataUrl => compressImage(dataUrl, 512, 0.6))
        );
        const res = await aiService.generateCaptionVision(compressedImages, tone, "");
        caption = res.suggestion || res;
      } else {
        caption = await generateCaption("", [], tone);
      }
      if (caption) {
        setSuggestion(caption);
        setShowSuggestion(true);
      }
    } catch (e) {
      console.error("Errore caption AI:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUse = () => {
    onCaptionGenerated(suggestion);
    setShowSuggestion(false);
    setSuggestion("");
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.06))",
      border: "1px solid rgba(124,58,237,0.2)",
      borderRadius: "var(--nx-radius-lg)",
      padding: "14px 16px",
      marginBottom: "12px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#7c3aed">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        <h3 style={{ fontWeight: 700, fontSize: "13px", color: "var(--nx-text)" }}>Genera Caption con AI</h3>
      </div>

      {/* Tone Selector */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--nx-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Scegli il tono:
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {tones.map((t) => (
            <button type="button" key={t.value} onClick={() => setTone(t.value)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "7px 12px", borderRadius: "var(--nx-radius-sm)", fontSize: "12px", fontWeight: 600,
                border: tone === t.value ? "1.5px solid rgba(124,58,237,0.5)" : "1.5px solid var(--nx-border)",
                background: tone === t.value ? "rgba(124,58,237,0.12)" : "var(--nx-surface)",
                color: tone === t.value ? "#7c3aed" : "var(--nx-text-muted)",
                cursor: "pointer", transition: "all var(--nx-transition)",
              }}>
              <span>{t.emoji}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button type="button" onClick={handleGenerate} disabled={loading}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          padding: "8px 16px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
          color: "#fff", border: "none", borderRadius: "var(--nx-radius-sm)",
          fontSize: "13px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1, transition: "opacity var(--nx-transition)",
        }}>
        {loading ? (
          <>
            <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <span>Generazione in corso...</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span>Genera Caption</span>
          </>
        )}
      </button>

      {/* Suggestion Display */}
      {showSuggestion && (
        <div style={{ marginTop: "12px" }}>
          <div style={{
            background: "var(--nx-surface)", border: "1px solid var(--nx-border)",
            borderRadius: "var(--nx-radius)", padding: "12px 14px",
          }}>
            <p style={{ fontSize: "13px", color: "var(--nx-text)", marginBottom: "10px", lineHeight: 1.5 }}>{suggestion}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" onClick={handleUse}
                style={{
                  flex: 1, padding: "7px 12px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  color: "#fff", border: "none", borderRadius: "var(--nx-radius-sm)",
                  fontSize: "12px", fontWeight: 600, cursor: "pointer",
                }}>
                ✓ Usa questa caption
              </button>
              <button type="button" onClick={handleGenerate} disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 12px", background: "var(--nx-surface-2)",
                  color: "var(--nx-text-muted)", border: "1px solid var(--nx-border)",
                  borderRadius: "var(--nx-radius-sm)", fontSize: "12px", fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1,
                }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rigenera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AICaptionGenerator;