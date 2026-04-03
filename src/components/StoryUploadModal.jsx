import { useState, useRef } from "react";
import { createStory } from "../services/storyService";
import toast from "react-hot-toast";

const ACCEPTED = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm";

function StoryUploadModal({ isOpen, onClose, onCreated }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  if (!isOpen) return null;

  const handleFile = (f) => {
    if (!f) return;
    const video = f.type.startsWith("video/");
    setFile(f);
    setIsVideo(video);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    const result = await createStory(file, caption);
    setLoading(false);
    if (result.success) {
      toast.success("Storia pubblicata! ✨");
      onCreated?.(result.data);
      handleClose();
    } else {
      toast.error(result.error || "Errore nel caricamento");
    }
  };

  const handleClose = () => {
    setFile(null); setPreview(null); setCaption(""); setIsVideo(false); setLoading(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={handleClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "relative", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-xl)", boxShadow: "var(--nx-shadow-lg)", width: "100%", maxWidth: "420px", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--nx-border)" }}>
          <h2 style={{ fontWeight: 800, fontSize: "15px", color: "var(--nx-text)" }}>Nuova storia</h2>
          <button onClick={handleClose} style={{ padding: "4px", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", display: "flex" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          {!preview ? (
            /* Drop zone */
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "#7c3aed" : "var(--nx-border)"}`,
                borderRadius: "var(--nx-radius-lg)", padding: "40px 20px",
                textAlign: "center", cursor: "pointer",
                background: dragging ? "rgba(124,58,237,0.06)" : "var(--nx-surface-2)",
                transition: "all var(--nx-transition)",
              }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📷</div>
              <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--nx-text)", marginBottom: "6px" }}>
                Trascina qui o clicca per scegliere
              </p>
              <p style={{ fontSize: "12px", color: "var(--nx-text-muted)" }}>
                JPG, PNG, GIF, MP4, WebM · Max 50MB
              </p>
              <input ref={inputRef} type="file" accept={ACCEPTED} style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])} />
            </div>
          ) : (
            /* Preview */
            <div>
              <div style={{ position: "relative", borderRadius: "var(--nx-radius-lg)", overflow: "hidden", background: "#000", maxHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isVideo ? (
                  <video src={preview} controls style={{ width: "100%", maxHeight: "300px", objectFit: "contain" }} />
                ) : (
                  <img src={preview} alt="preview" style={{ width: "100%", maxHeight: "300px", objectFit: "contain" }} />
                )}
                <button onClick={() => { setFile(null); setPreview(null); }}
                  style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", fontSize: "12px" }}>
                  ✕
                </button>
              </div>
              {/* Caption */}
              <div style={{ marginTop: "14px" }}>
                <input value={caption} onChange={e => setCaption(e.target.value)}
                  placeholder="Aggiungi una didascalia..." maxLength={200}
                  style={{ width: "100%", background: "var(--nx-input-bg)", border: "1.5px solid var(--nx-input-border)", borderRadius: "var(--nx-radius)", padding: "9px 12px", fontSize: "13px", color: "var(--nx-text)", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "rgba(124,58,237,0.5)"}
                  onBlur={e => e.target.style.borderColor = "var(--nx-input-border)"} />
                <p style={{ fontSize: "11px", color: "var(--nx-text-subtle)", textAlign: "right", marginTop: "4px" }}>{caption.length}/200</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && (
          <div style={{ display: "flex", gap: "10px", padding: "0 20px 20px" }}>
            <button onClick={handleClose} disabled={loading}
              style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "var(--nx-radius-full)", cursor: "pointer" }}>
              Annulla
            </button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", fontSize: "13px", fontWeight: 700, background: "var(--nx-grad-btn)", color: "#fff", border: "none", borderRadius: "var(--nx-radius-full)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading
                ? <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /><span>Pubblicazione...</span></>
                : "✦ Pubblica storia"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoryUploadModal;