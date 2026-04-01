import { useEffect } from 'react';

function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 40 }}
        onClick={onClose} />
      <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-xl)", boxShadow: "var(--nx-shadow-lg)", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--nx-border)" }}>
            <h2 style={{ fontWeight: 800, fontSize: "16px", color: "var(--nx-text)" }}>{title}</h2>
            <button onClick={onClose}
              style={{ padding: "5px", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", display: "flex", transition: "all var(--nx-transition)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </>
  );
}

export default Modal;