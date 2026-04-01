import { useState } from "react";
import { createPortal } from "react-dom";

function AvatarZoom({ src, username, size = "md", className = "" }) {
  const [zoomed, setZoomed] = useState(false);

  const pxMap = { sm: 32, md: 40, lg: 64, xl: 96, profile: 80 };
  const px = pxMap[size] ?? 40;
  const initial = username?.charAt(0).toUpperCase() || "?";

  const handleClick = (e) => {
    if (!src) return;
    e.preventDefault(); e.stopPropagation();
    setZoomed(true);
  };

  return (
    <>
      <div style={{ width: px, height: px, borderRadius: "50%", flexShrink: 0, cursor: src ? "zoom-in" : "default" }}
        className={className} onClick={handleClick}>
        {src ? (
          <img src={src} alt={username}
            style={{ width: px, height: px, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--nx-border)", transition: "box-shadow var(--nx-transition)" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 0 2px #7c3aed"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"} />
        ) : (
          <div className="nx-avatar-gradient" style={{ width: px, height: px, fontSize: Math.max(10, px * 0.35) }}>
            {initial}
          </div>
        )}
      </div>

      {zoomed && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 999999, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
          onClick={() => setZoomed(false)}>
          <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
            <img src={src} alt={username}
              style={{ width: 280, height: 280, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(124,58,237,0.6)", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }} />
            <button onClick={() => setZoomed(false)}
              style={{ position: "absolute", top: -10, right: -10, background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--nx-text-muted)", boxShadow: "var(--nx-shadow)" }}>
              ✕
            </button>
            <p style={{ color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 10, fontWeight: 600, fontSize: 13 }}>
              @{username}
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default AvatarZoom;