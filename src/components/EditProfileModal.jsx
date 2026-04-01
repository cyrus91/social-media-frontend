import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateBio, uploadAvatar, deleteAvatar, deleteAccount } from "../services/userService";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const SPINNER = (size = 16) => (
  <div style={{ width: size, height: size, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
);

function EditProfileModal({ isOpen, onClose, currentProfile, onProfileUpdated }) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [bio, setBio] = useState(currentProfile?.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentProfile?.avatarUrl || null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Il file deve essere un'immagine!"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("L'immagine non può superare 5MB!"); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm("Sei sicuro di voler rimuovere l'avatar?")) return;
    setLoading(true);
    const result = await deleteAvatar();
    if (result.success) {
      toast.success("Avatar rimosso!");
      setAvatarPreview(null);
      setAvatarFile(null);
      if (onProfileUpdated) onProfileUpdated({ ...currentProfile, avatarUrl: null });
    } else { toast.error(result.error || "Errore rimozione avatar"); }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (avatarFile) {
        const uploadResult = await uploadAvatar(avatarFile);
        if (!uploadResult.success) { toast.error(uploadResult.error || "Errore upload avatar"); setLoading(false); return; }
        toast.success("Avatar caricato!");
      }
      const bioResult = await updateBio(bio);
      if (!bioResult.success) { toast.error(bioResult.error || "Errore aggiornamento bio"); setLoading(false); return; }
      toast.success("Profilo aggiornato!");
      if (onProfileUpdated) onProfileUpdated(bioResult.data);
      onClose();
    } catch { toast.error("Errore salvataggio profilo"); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINA") { toast.error("Scrivi 'ELIMINA' per confermare"); return; }
    setLoading(true);
    const result = await deleteAccount();
    if (result.success) { toast.success("Account eliminato"); logout(); onClose(); navigate("/login"); }
    else { toast.error(result.error || "Errore eliminazione account"); setLoading(false); }
  };

  const LABEL = { fontSize: "12px", fontWeight: 700, color: "var(--nx-text-muted)", marginBottom: "6px", display: "block" };
  const INPUT_STYLE = { width: "100%", background: "var(--nx-input-bg)", border: "1.5px solid var(--nx-input-border)", borderRadius: "var(--nx-radius)", padding: "9px 12px", fontSize: "13px", color: "var(--nx-text)", outline: "none", resize: "none", transition: "border-color var(--nx-transition)" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-xl)", boxShadow: "var(--nx-shadow-lg)", width: "100%", maxWidth: "480px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--nx-border)", position: "sticky", top: 0, background: "var(--nx-surface)", zIndex: 10 }}>
          <h2 style={{ fontWeight: 800, fontSize: "16px", color: "var(--nx-text)" }}>Modifica Profilo</h2>
          <button onClick={onClose} disabled={loading}
            style={{ padding: "5px", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", display: "flex", transition: "all var(--nx-transition)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div style={{ position: "relative" }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{ width: "96px", height: "96px", borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(124,58,237,0.4)" }} />
              ) : (
                <div className="nx-avatar-gradient" style={{ width: "96px", height: "96px", fontSize: "36px" }}>
                  {currentProfile?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              {avatarPreview && (
                <button onClick={handleRemoveAvatar} disabled={loading} title="Rimuovi avatar"
                  style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--nx-surface)", cursor: "pointer" }}>
                  <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <label style={{ cursor: "pointer", background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1.5px solid rgba(124,58,237,0.25)", borderRadius: "var(--nx-radius-full)", padding: "7px 16px", fontSize: "13px", fontWeight: 600 }}>
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} disabled={loading} />
              📸 Cambia Avatar
            </label>
            <p style={{ fontSize: "11px", color: "var(--nx-text-subtle)" }}>Max 5MB · JPG, PNG, GIF</p>
          </div>

          {/* Bio */}
          <div>
            <label style={LABEL}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Raccontaci qualcosa di te..." maxLength={500} rows={4} disabled={loading}
              style={INPUT_STYLE}
              onFocus={e => e.target.style.borderColor = "rgba(124,58,237,0.5)"}
              onBlur={e => e.target.style.borderColor = "var(--nx-input-border)"} />
            <p style={{ fontSize: "11px", color: "var(--nx-text-subtle)", textAlign: "right", marginTop: "4px" }}>{bio.length}/500</p>
          </div>

          {/* Danger zone */}
          <div style={{ borderTop: "2px solid rgba(239,68,68,0.2)", paddingTop: "16px" }}>
            <h3 style={{ fontWeight: 700, fontSize: "13px", color: "#ef4444", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Zona Pericolo
            </h3>
            <p style={{ fontSize: "12px", color: "var(--nx-text-muted)", marginBottom: "12px" }}>
              L'eliminazione dell'account è <strong>permanente e irreversibile</strong>
            </p>

            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} disabled={loading}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--nx-radius)", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all var(--nx-transition)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.14)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}>
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Elimina Account
              </button>
            ) : (
              <div style={{ background: "rgba(239,68,68,0.06)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: "var(--nx-radius-lg)", padding: "14px" }}>
                <p style={{ fontWeight: 700, fontSize: "13px", color: "#ef4444", marginBottom: "8px" }}>⚠️ SEI ASSOLUTAMENTE SICURO?</p>
                <ul style={{ fontSize: "12px", color: "var(--nx-text-muted)", marginBottom: "12px", paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {["post", "commenti", "like", "follower/following"].map(item => (
                    <li key={item}>Tutti i tuoi <strong>{item}</strong> verranno eliminati</li>
                  ))}
                  <li><strong>Questa azione NON può essere annullata!</strong></li>
                </ul>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#ef4444", display: "block", marginBottom: "6px" }}>
                  Scrivi "ELIMINA" per confermare:
                </label>
                <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="ELIMINA" disabled={loading}
                  style={{ ...INPUT_STYLE, fontFamily: "monospace", letterSpacing: "0.1em", borderColor: "rgba(239,68,68,0.35)", marginBottom: "10px" }}
                  onFocus={e => e.target.style.borderColor = "#ef4444"}
                  onBlur={e => e.target.style.borderColor = "rgba(239,68,68,0.35)"} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }} disabled={loading}
                    style={{ flex: 1, padding: "8px", fontSize: "13px", fontWeight: 600, background: "var(--nx-surface-2)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius)", cursor: "pointer", color: "var(--nx-text)" }}>
                    Annulla
                  </button>
                  <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== "ELIMINA" || loading}
                    style={{ flex: 1, padding: "8px", fontSize: "13px", fontWeight: 600, background: "#ef4444", border: "none", borderRadius: "var(--nx-radius)", cursor: deleteConfirmText !== "ELIMINA" ? "not-allowed" : "pointer", color: "#fff", opacity: deleteConfirmText !== "ELIMINA" ? 0.5 : 1 }}>
                    {loading ? "Eliminazione..." : "Conferma Eliminazione"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", padding: "14px 20px", borderTop: "1px solid var(--nx-border)", background: "var(--nx-surface)", position: "sticky", bottom: 0 }}>
          <button onClick={onClose} disabled={loading}
            style={{ padding: "8px 18px", fontSize: "13px", fontWeight: 600, background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "var(--nx-radius-full)", cursor: "pointer" }}>
            Annulla
          </button>
          <button onClick={handleSave} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", fontSize: "13px", fontWeight: 600, background: "var(--nx-grad-btn)", color: "#fff", border: "none", borderRadius: "var(--nx-radius-full)", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? <>{SPINNER(14)}<span>Salvataggio...</span></> : <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span>Salva Modifiche</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;