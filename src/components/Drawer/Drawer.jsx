import { useEffect } from "react";
import { createPortal } from "react-dom";

function Drawer({ isOpen, onClose, title, children, size = "md", showPostPreview = false, postContent = null }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape" && isOpen) onClose(); };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeMap = { sm: "360px", md: "420px", lg: "520px", xl: "640px", full: "100%" };

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
      {/* Backdrop */}
      <div style={{ position: "fixed", inset: 0, background: showPostPreview ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", transition: "opacity 300ms" }}
        onClick={onClose} />

      {/* Layout */}
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>

        {/* Post preview — desktop */}
        {showPostPreview && postContent && (
          <div style={{ display: "none", flex: 1, alignItems: "center", justifyContent: "center", padding: "32px", maxWidth: "800px" }}
            className="md:flex">
            <div style={{ position: "relative", zIndex: 10, width: "100%" }}>
              {postContent}
            </div>
          </div>
        )}

        {/* Drawer panel */}
        <div style={{
          position: "relative",
          width: "100%", maxWidth: sizeMap[size],
          height: "100%",
          background: "var(--nx-surface)",
          borderLeft: "1px solid var(--nx-border)",
          boxShadow: "var(--nx-shadow-lg)",
          display: "flex", flexDirection: "column",
        }}
          role="dialog" aria-modal="true" aria-labelledby="drawer-title"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--nx-border)", background: "var(--nx-surface)", position: "sticky", top: 0, zIndex: 10 }}>
            <h2 id="drawer-title" style={{ fontWeight: 800, fontSize: "15px", color: "var(--nx-text)" }}>{title}</h2>
            <button onClick={onClose} aria-label="Chiudi"
              style={{ padding: "6px", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", display: "flex", transition: "all var(--nx-transition)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Drawer;