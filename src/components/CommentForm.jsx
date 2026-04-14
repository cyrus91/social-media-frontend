import { useRef, useState } from "react";
import { useMentionInput } from "../hooks/useMentionInput";
import MentionSuggestions from "./MentionSuggestions";
import MentionTextarea from "./MentionTextarea";
import EmojiPickerButton from "./EmojiPickerButton";
import { aiService } from "../services/aiService";
import toast from "react-hot-toast";

function CommentForm({ user, onSubmit, submitting }) {
  const [commentText, setCommentText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [improvingComment, setImprovingComment] = useState(false);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);

  const { handleChange, selectMention, suggestions, showSuggestions } = useMentionInput(commentText, setCommentText);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Immagine troppo grande (max 5MB)"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleImprove = async () => {
    if (!commentText.trim()) return;
    setImprovingComment(true);
    try {
      const result = await aiService.improveText(commentText.trim());
      setCommentText(result.suggestion || result.result || result);
      toast.success("Testo migliorato ✨");
    } catch { toast.error("Errore AI"); }
    finally { setImprovingComment(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !imageFile) return;
    const success = await onSubmit(commentText, imageFile);
    if (success) {
      setCommentText("");
      setImageFile(null);
      setImagePreview(null);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  const hasContent = commentText.trim() || imageFile;

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Scrivi un commento"
      style={{ display: "flex", alignItems: "flex-start", gap: "8px", paddingTop: "12px", borderTop: "1px solid var(--nx-border)" }}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        {user.avatarUrl
          ? <img src={user.avatarUrl} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
          : <div className="nx-avatar-gradient" style={{ width: "32px", height: "32px", fontSize: "11px" }}>
              {user.username?.charAt(0).toUpperCase()}
            </div>}
      </div>

      {/* Input area */}
      <div style={{ flex: 1, position: "relative" }}>
        <MentionSuggestions suggestions={suggestions} visible={showSuggestions} onSelect={(u) => selectMention(u, textareaRef)} anchorRef={textareaRef} />

        <div style={{
          border: `1.5px solid ${commentText ? "rgba(124,58,237,0.4)" : "var(--nx-input-border)"}`,
          borderRadius: "var(--nx-radius-lg)",
          background: "var(--nx-input-bg)",
          boxShadow: commentText ? "0 0 0 3px rgba(124,58,237,0.08)" : "none",
          transition: "border-color var(--nx-transition), box-shadow var(--nx-transition)",
        }}>
          {/* Toolbar sempre visibile quando vuoto */}
          <div style={{ display: "flex", alignItems: "center", padding: "6px 12px", gap: "8px" }}>
            {!hasContent && (
              <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
                <EmojiPickerButton onEmojiSelect={emoji => setCommentText(p => p + emoji)} />
                <button type="button" onClick={() => imageInputRef.current?.click()}
                  aria-label="Allega immagine"
                  title="Aggiungi foto"
                  style={{ padding: "4px", color: "var(--nx-text-subtle)", background: "none", border: "none", cursor: "pointer", display: "flex", borderRadius: "50%", transition: "color var(--nx-transition)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-subtle)"}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            )}
            <MentionTextarea
              textareaRef={textareaRef}
              value={commentText}
              onChange={e => {
                setCommentText(e.target.value);
                handleChange(e);
                const ta = textareaRef.current;
                if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 120) + "px"; }
              }}
              placeholder="Scrivi un commento..."
              aria-label="Testo del commento"
              rows={1}
              className="flex-1"
            />
          </div>

          {/* Preview immagine */}
          {imagePreview && (
            <div style={{ padding: "0 12px 8px", position: "relative", display: "inline-block" }}>
              <img src={imagePreview} alt="Anteprima immagine allegata"
                style={{ maxHeight: "120px", borderRadius: "var(--nx-radius)", objectFit: "cover", border: "1px solid var(--nx-border)" }} />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                aria-label="Rimuovi immagine"
                style={{ position: "absolute", top: "4px", right: "4px", width: "18px", height: "18px", background: "#ef4444", color: "#fff", borderRadius: "50%", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
                ✕
              </button>
            </div>
          )}

          {/* Toolbar espansa quando c'è contenuto */}
          {hasContent && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px 8px", borderTop: "1px solid var(--nx-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                <EmojiPickerButton onEmojiSelect={emoji => setCommentText(p => p + emoji)} />
                <button type="button" onClick={() => imageInputRef.current?.click()}
                  aria-label="Allega immagine"
                  title="Aggiungi foto"
                  style={{ padding: "4px", color: "var(--nx-text-subtle)", background: "none", border: "none", cursor: "pointer", display: "flex", borderRadius: "50%", transition: "color var(--nx-transition)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-subtle)"}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                {commentText.trim() && (
                  <button type="button" onClick={handleImprove} disabled={improvingComment}
                    aria-label="Migliora testo con AI"
                    title="Migliora con AI"
                    style={{ display: "flex", alignItems: "center", gap: "3px", padding: "3px 8px", fontSize: "11px", fontWeight: 600, color: "#7c3aed", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "var(--nx-radius-full)", cursor: "pointer", opacity: improvingComment ? 0.6 : 1, transition: "all var(--nx-transition)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.14)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(124,58,237,0.08)"}>
                    {improvingComment
                      ? <><div style={{ width: "9px", height: "9px", border: "1.5px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /><span>...</span></>
                      : <><span aria-hidden="true">✨</span><span>Migliora</span></>}
                  </button>
                )}
              </div>
              <button type="submit" disabled={submitting || !hasContent}
                aria-label="Pubblica commento"
                style={{ background: "var(--nx-grad-btn)", color: "#fff", fontSize: "11px", fontWeight: 600, padding: "4px 14px", borderRadius: "var(--nx-radius-full)", border: "none", cursor: "pointer", opacity: submitting || !hasContent ? 0.5 : 1, transition: "opacity var(--nx-transition)" }}>
                {submitting ? "..." : "Commenta"}
              </button>
            </div>
          )}

          <input ref={imageInputRef} type="file" accept="image/*" aria-hidden="true"
            style={{ display: "none" }} onChange={handleImageSelect} />
        </div>
      </div>
    </form>
  );
}

export default CommentForm;