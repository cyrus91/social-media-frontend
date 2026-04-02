import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import api from "../services/api";
import EmojiPickerButton from "./EmojiPickerButton";
import AICaptionGenerator from "./AICaptionGenerator";
import AIHashtagSuggester from "./AIHashtagSuggester";
import { aiService } from "../services/aiService";
import { useMentionInput } from "../hooks/useMentionInput";
import MentionSuggestions from "./MentionSuggestions";
import MentionTextarea from "./MentionTextarea";

function CreatePostWithImages({ onPostCreated }) {
  const currentUser = useAuthStore((state) => state.user);
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [improvingAI, setImprovingAI] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const { handleChange: handleMentionChange, selectMention, suggestions: mentionSuggestions, showSuggestions: showMentionSuggestions } = useMentionInput(
    content,
    setContent
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [content]);

  const handleImproveText = async () => {
    if (!content.trim()) return;
    setImprovingAI(true);
    try {
      const result = await aiService.improveText(content.trim());
      setContent(result.suggestion || result.result || result);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
      }
      toast.success("Testo migliorato con AI ✨");
    } catch {
      toast.error("Errore nel miglioramento AI");
    } finally {
      setImprovingAI(false);
    }
  };

  const hasContent = content.trim() || images.length > 0;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - images.length;
    const accepted = files.slice(0, remaining);
    accepted.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} supera 5MB`); return; }
      setImages((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onload = () => setPreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
    if (files.length > remaining) toast.error("Massimo 5 immagini per post");
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTextareaChange = (e) => {
    setContent(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      if (!e.target.value) {
        // Reset altezza quando il contenuto è vuoto
        ta.style.height = "auto";
      } else {
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasContent) { toast.error("Scrivi qualcosa o aggiungi un'immagine"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      if (content.trim()) formData.append("content", content.trim());
      images.forEach((img) => formData.append("images", img));
      const response = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Post pubblicato!");
      setContent("");
      setImages([]);
      setPreviews([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      if (onPostCreated) onPostCreated(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Errore nella pubblicazione");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      background: "var(--nx-surface)",
      border: "1px solid var(--nx-border)",
      borderRadius: "var(--nx-radius-lg)",
      boxShadow: "var(--nx-shadow-sm)",
      padding: "16px",
    }}>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt={currentUser.username}
              style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(124,58,237,0.3)" }} />
          ) : (
            <div className="nx-avatar-gradient" style={{ width: "38px", height: "38px", fontSize: "13px", flexShrink: 0 }}>
              {currentUser?.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--nx-text)" }}>{currentUser?.username}</p>
            <p style={{ fontSize: "11px", color: "var(--nx-text-muted)" }}>Crea un nuovo post</p>
          </div>
        </div>

        {/* AI Caption */}
        {previews.length > 0 && (
          <div className="mb-3">
            <AICaptionGenerator
              onCaptionGenerated={(caption) => { setContent(caption); toast.success("Caption inserita!"); }}
              imageUrls={previews}
            />
          </div>
        )}

        {/* Box principale */}
        <div style={{ position: "relative" }}>
          <MentionSuggestions
            suggestions={mentionSuggestions}
            visible={showMentionSuggestions}
            onSelect={(username) => selectMention(username, textareaRef)}
            anchorRef={textareaRef}
          />
          <div style={{
            border: `1.5px solid ${hasContent ? "rgba(124,58,237,0.4)" : "var(--nx-border)"}`,
            borderRadius: "var(--nx-radius-lg)",
            transition: "border-color var(--nx-transition), box-shadow var(--nx-transition)",
            boxShadow: hasContent ? "0 0 0 3px rgba(124,58,237,0.08)" : "none",
            background: "var(--nx-input-bg)",
          }}>
            {/* Textarea row */}
            <div style={{ display: "flex", alignItems: "center", padding: hasContent ? "10px 12px 4px" : "6px 12px", gap: "8px" }}>
              {!hasContent && (
                <div style={{ flexShrink: 0 }}>
                  <EmojiPickerButton
                    onEmojiSelect={(emoji) => {
                      setContent((prev) => prev + emoji);
                      textareaRef.current?.focus();
                    }}
                  />
                </div>
              )}
              <MentionTextarea
                textareaRef={textareaRef}
                value={content}
                onChange={(e) => { handleTextareaChange(e); handleMentionChange(e); }}
                placeholder="Cosa stai pensando?"
                rows={hasContent ? 3 : 1}
                disabled={uploading}
                className="flex-1"
              />
            </div>

            {/* Preview immagini */}
            {previews.length > 0 && (
              <div style={{ padding: "0 12px 10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                  {previews.map((preview, index) => (
                    <div key={index} style={{ position: "relative" }} className="group">
                      <img src={preview} alt={`Preview ${index + 1}`}
                        style={{ width: "100%", height: "72px", objectFit: "cover", borderRadius: "var(--nx-radius-sm)", border: "1px solid var(--nx-border)" }} />
                      <button type="button" onClick={() => removeImage(index)}
                        style={{
                          position: "absolute", top: "3px", right: "3px",
                          background: "#ef4444", color: "#fff",
                          borderRadius: "50%", width: "18px", height: "18px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "10px", border: "none", cursor: "pointer",
                        }}>✕</button>
                      <div style={{
                        position: "absolute", bottom: "3px", left: "3px",
                        background: "rgba(0,0,0,0.6)", color: "#fff",
                        fontSize: "10px", padding: "1px 5px", borderRadius: "99px"
                      }}>{index + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Barra inferiore */}
            {hasContent && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 10px 8px",
                borderTop: "1px solid var(--nx-border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                  <EmojiPickerButton
                    onEmojiSelect={(emoji) => {
                      setContent((prev) => prev + emoji);
                      textareaRef.current?.focus();
                    }}
                  />
                  {images.length < 5 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      title="Aggiungi immagine"
                      style={{
                        padding: "6px", border: "none", background: "none", cursor: "pointer",
                        color: "var(--nx-text-muted)", borderRadius: "var(--nx-radius-sm)",
                        transition: "all var(--nx-transition)", display: "flex",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                  {content.trim() && (
                    <button type="button" onClick={handleImproveText}
                      disabled={improvingAI || uploading}
                      style={{
                        display: "flex", alignItems: "center", gap: "4px",
                        padding: "4px 10px", fontSize: "11px", fontWeight: 600,
                        color: "#7c3aed", background: "rgba(124,58,237,0.08)",
                        border: "1px solid rgba(124,58,237,0.2)",
                        borderRadius: "var(--nx-radius-full)", cursor: "pointer",
                        transition: "all var(--nx-transition)",
                        opacity: improvingAI || uploading ? 0.5 : 1,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.14)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(124,58,237,0.08)"}>
                      {improvingAI
                        ? <><div style={{ width: "10px", height: "10px", border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /><span>Miglioramento...</span></>
                        : <><span>✨</span><span>Migliora</span></>
                      }
                    </button>
                  )}
                  {content.trim() && (
                    <AIHashtagSuggester
                      content={content}
                      onHashtagsInsert={(text) => {
                        setContent(prev => prev + text);
                        textareaRef.current?.focus();
                      }}
                    />
                  )}
                </div>
                <button type="submit" disabled={uploading || !hasContent}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 16px", fontSize: "13px", fontWeight: 600,
                    background: "var(--nx-grad-btn)",
                    color: "#fff", border: "none", borderRadius: "var(--nx-radius-full)",
                    cursor: uploading || !hasContent ? "not-allowed" : "pointer",
                    opacity: !hasContent ? 0.5 : 1,
                    transition: "opacity var(--nx-transition)",
                  }}>
                  {uploading
                    ? <><div style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /><span>Pubblicazione...</span></>
                    : <span>Pubblica</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" multiple
          style={{ display: "none" }} onChange={handleFileSelect} disabled={uploading} />
      </form>
    </div>
  );
}

export default CreatePostWithImages;