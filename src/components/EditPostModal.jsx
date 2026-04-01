import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import api from "../services/api";

function EditPostModal({ isOpen, onClose, post, onPostUpdated }) {
  const [content, setContent] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      let images = [];
      if (post.images?.length > 0) images = [...post.images];
      else if (post.imageUrls?.length > 0) images = post.imageUrls.map((url, i) => ({ id: null, imageUrl: url, displayOrder: i }));
      else if (post.imageUrl) images = [{ id: null, imageUrl: post.imageUrl, displayOrder: 0 }];
      setContent(post.content || "");
      setExistingImages(images);
      setImagesToRemove([]); setNewImages([]); setNewImagePreviews([]); setSaving(false);
    }
  }, [isOpen, post.id]);

  const handleClose = () => { setNewImages([]); setNewImagePreviews([]); setImagesToRemove([]); onClose(); };
  const handleRemoveExistingImage = (index) => {
    setImagesToRemove(prev => [...prev, existingImages[index]]);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };
  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"] },
    maxFiles: 5, maxSize: 5 * 1024 * 1024,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (existingImages.length + newImages.length + acceptedFiles.length > 5) { toast.error("Massimo 5 immagini per post"); return; }
      rejectedFiles.forEach(f => f.errors.forEach(e => { if (e.code === "file-too-large") toast.error(`${f.file.name} supera 5MB`); }));
      setNewImages(prev => [...prev, ...acceptedFiles]);
      acceptedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => setNewImagePreviews(prev => [...prev, reader.result]);
        reader.readAsDataURL(file);
      });
    },
  });

  const handleSave = async () => {
    if (!content.trim() && existingImages.length === 0 && newImages.length === 0) {
      toast.error("Il post deve avere contenuto o almeno un'immagine"); return;
    }
    setSaving(true);
    try {
      await api.put(`/posts/${post.id}`, { content: content.trim() });
      for (const image of imagesToRemove) {
        if (image.id != null) await api.delete(`/posts/${post.id}/images/${image.id}`);
      }
      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach(img => formData.append("images", img));
        await api.post(`/posts/${post.id}/images`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      }
      const response = await api.get(`/posts/${post.id}`);
      toast.success("Post modificato con successo!");
      if (onPostUpdated) onPostUpdated(response.data);
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Errore nel salvataggio delle modifiche");
    } finally { setSaving(false); }
  };

  if (!isOpen) return null;
  const totalImages = existingImages.length + newImages.length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={handleClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-xl)", boxShadow: "var(--nx-shadow-lg)", width: "100%", maxWidth: "600px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--nx-border)", background: "var(--nx-surface)" }}>
          <h2 style={{ fontWeight: 800, fontSize: "16px", color: "var(--nx-text)" }}>Modifica Post</h2>
          <button onClick={handleClose}
            style={{ padding: "5px", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", display: "flex", transition: "all var(--nx-transition)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Textarea */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--nx-text-muted)", display: "block", marginBottom: "6px" }}>Contenuto</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
              placeholder="Modifica il contenuto del post..."
              style={{ width: "100%", background: "var(--nx-input-bg)", border: "1.5px solid var(--nx-input-border)", borderRadius: "var(--nx-radius)", padding: "10px 12px", fontSize: "13px", color: "var(--nx-text)", outline: "none", resize: "none", transition: "border-color var(--nx-transition)" }}
              onFocus={e => e.target.style.borderColor = "rgba(124,58,237,0.5)"}
              onBlur={e => e.target.style.borderColor = "var(--nx-input-border)"} />
          </div>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--nx-text-muted)", display: "block", marginBottom: "8px" }}>
                Immagini attuali ({existingImages.length})
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                {existingImages.map((img, i) => (
                  <div key={img.id ?? `existing-${i}`} style={{ position: "relative" }}>
                    <img src={img.imageUrl} alt={`Immagine ${i + 1}`}
                      style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "var(--nx-radius-sm)", border: "1px solid var(--nx-border)" }} />
                    <button type="button" onClick={() => handleRemoveExistingImage(i)}
                      style={{ position: "absolute", top: "3px", right: "3px", background: "#ef4444", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", border: "none", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New images */}
          {newImagePreviews.length > 0 && (
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--nx-text-muted)", display: "block", marginBottom: "8px" }}>
                Nuove immagini ({newImagePreviews.length})
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                {newImagePreviews.map((preview, i) => (
                  <div key={`new-${i}`} style={{ position: "relative" }}>
                    <img src={preview} alt={`Nuova ${i + 1}`}
                      style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "var(--nx-radius-sm)", border: "1px solid rgba(124,58,237,0.3)" }} />
                    <button type="button" onClick={() => handleRemoveNewImage(i)}
                      style={{ position: "absolute", top: "3px", right: "3px", background: "#ef4444", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", border: "none", cursor: "pointer" }}>✕</button>
                    <div style={{ position: "absolute", bottom: "3px", left: "3px", background: "rgba(124,58,237,0.85)", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px" }}>NEW</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dropzone */}
          {totalImages < 5 && (
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--nx-text-muted)", display: "block", marginBottom: "8px" }}>
                Aggiungi immagini ({totalImages}/5)
              </label>
              <div {...getRootProps()} style={{
                border: `2px dashed ${isDragActive ? "#7c3aed" : "var(--nx-border)"}`,
                borderRadius: "var(--nx-radius-lg)", padding: "24px", textAlign: "center", cursor: "pointer",
                background: isDragActive ? "rgba(124,58,237,0.06)" : "var(--nx-surface-2)",
                transition: "all var(--nx-transition)",
              }}>
                <input {...getInputProps()} />
                <svg width="32" height="32" fill="none" stroke="var(--nx-text-subtle)" viewBox="0 0 24 24" style={{ margin: "0 auto 8px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <p style={{ fontSize: "13px", color: "var(--nx-text-muted)" }}>
                  {isDragActive ? "Rilascia qui..." : "Trascina immagini o clicca"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", padding: "14px 20px", borderTop: "1px solid var(--nx-border)", background: "var(--nx-surface-2)" }}>
          <button onClick={handleClose} disabled={saving}
            style={{ padding: "8px 18px", fontSize: "13px", fontWeight: 600, background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "var(--nx-radius-full)", cursor: "pointer" }}>
            Annulla
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", fontSize: "13px", fontWeight: 600, background: "var(--nx-grad-btn)", color: "#fff", border: "none", borderRadius: "var(--nx-radius-full)", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving
              ? <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /><span>Salvataggio...</span></>
              : <span>Salva modifiche</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditPostModal;