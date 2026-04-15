import { useEffect, useRef } from "react";

/**
 * Modale di conferma riutilizzabile — sostituisce window.confirm
 * Props: isOpen, title, message, confirmLabel, danger, onConfirm, onCancel
 */
export default function ConfirmModal({
  isOpen,
  title = "Sei sicuro?",
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  danger = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    // Focus sul bottone di conferma
    setTimeout(() => confirmRef.current?.focus(), 10);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      aria-hidden="true"
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-xl)", boxShadow: "var(--nx-shadow-lg)", width: "min(420px, 92vw)", padding: "28px 24px", textAlign: "center" }}
      >
        {/* Icona */}
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: danger ? "rgba(239,68,68,0.1)" : "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          {danger ? (
            <svg width="22" height="22" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" stroke="#7c3aed" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          )}
        </div>

        <h2 id="confirm-modal-title" style={{ fontWeight: 800, fontSize: "16px", color: "var(--nx-text)", marginBottom: "8px" }}>
          {title}
        </h2>
        {message && (
          <p style={{ fontSize: "13px", color: "var(--nx-text-muted)", marginBottom: "24px", lineHeight: 1.5 }}>
            {message}
          </p>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, maxWidth: "160px", padding: "9px 20px", borderRadius: "var(--nx-radius-full)", background: "var(--nx-surface-2)", border: "1px solid var(--nx-border)", color: "var(--nx-text)", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            style={{ flex: 1, maxWidth: "160px", padding: "9px 20px", borderRadius: "var(--nx-radius-full)", background: danger ? "#ef4444" : "var(--nx-grad-btn)", border: "none", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}