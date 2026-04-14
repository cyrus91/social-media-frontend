import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal accessibile WCAG 2.1 AA:
 * - role="dialog" + aria-modal="true"
 * - aria-labelledby collegato al titolo
 * - Focus trap: il focus rimane dentro il modale
 * - Focus restore: al chiusura il focus torna al trigger
 * - ESC chiude
 * - scroll body bloccato quando aperto
 */
function Modal({ isOpen, onClose, title, children, size = "md" }) {
  const id = useId();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  const maxWidths = { sm: "400px", md: "520px", lg: "680px" };

  useEffect(() => {
    if (!isOpen) return;

    // Salva il focus corrente per ripristinarlo alla chiusura
    previousFocusRef.current = document.activeElement;

    // Focus sul dialog al mount
    const timer = setTimeout(() => dialogRef.current?.focus(), 10);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") { onClose(); return; }

      // Focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      // Ripristina il focus al trigger originale
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const titleId = `modal-title-${id}`;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 40 }}
      />

      {/* Dialog */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
        aria-hidden="false"
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onClick={e => e.stopPropagation()}
          style={{
            background: "var(--nx-surface)", border: "1px solid var(--nx-border)",
            borderRadius: "var(--nx-radius-xl)", boxShadow: "var(--nx-shadow-lg)",
            width: "100%", maxWidth: maxWidths[size] || maxWidths.md,
            maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
            outline: "none",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--nx-border)" }}>
            <h2 id={titleId} style={{ fontWeight: 800, fontSize: "16px", color: "var(--nx-text)", margin: 0 }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Chiudi finestra di dialogo"
              style={{ padding: "5px", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", display: "flex", transition: "all var(--nx-transition)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div style={{ overflowY: "auto", padding: "20px" }}>
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default Modal;