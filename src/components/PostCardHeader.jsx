import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AvatarZoom from "./AvatarZoom";

function PostCardHeader({ post, isMyPost, isDeleting, formatDate, onEdit, onDelete, onReport }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const menuItemStyle = (isDanger) => ({
    width: "100%", display: "flex", alignItems: "center", gap: "8px",
    padding: "8px 10px", background: "none", border: "none", cursor: "pointer",
    fontSize: "13px", fontWeight: 500, borderRadius: "var(--nx-radius-sm)",
    color: isDanger ? "#ef4444" : "var(--nx-text)", textAlign: "left",
    transition: "background var(--nx-transition)",
  });

  return (
    <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--nx-border)" }}>
      <Link
        to={`/profile/${post.authorUsername}`}
        aria-label={`Profilo di ${post.authorUsername}`}
        style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
      >
        <AvatarZoom src={post.authorAvatarUrl} username={post.authorUsername} size="md" />
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--nx-text)", lineHeight: 1.2 }}>
            {post.authorUsername}
          </p>
          <p style={{ fontSize: "11px", color: "var(--nx-text-subtle)", marginTop: "2px" }}>
            {formatDate(post.createdAt)}
          </p>
        </div>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Apri post — desktop */}
        <Link
          to={`/post/${post.id}`}
          aria-label="Apri post in pagina dedicata"
          className="hidden sm:flex"
          style={{ display: "none", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: "var(--nx-text-muted)", textDecoration: "none", padding: "5px 10px", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-sm)", transition: "all var(--nx-transition)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#7c3aed"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.35)"; e.currentTarget.style.background = "rgba(124,58,237,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--nx-text-muted)"; e.currentTarget.style.borderColor = "var(--nx-border)"; e.currentTarget.style.background = "none"; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          Apri
        </Link>

        {/* Menu 3 punti */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(s => !s)}
            aria-label="Opzioni post"
            aria-expanded={showMenu}
            aria-haspopup="true"
            style={{ padding: "5px", borderRadius: "var(--nx-radius-sm)", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-subtle)", transition: "all var(--nx-transition)", display: "flex" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-subtle)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>

          {showMenu && (
            <div
              role="menu"
              aria-label="Opzioni post"
              className="nx-animate-in"
              style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: "180px", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", boxShadow: "var(--nx-shadow-lg)", zIndex: 50, padding: "6px", overflow: "hidden" }}
            >
              <Link to={`/post/${post.id}`} onClick={() => setShowMenu(false)}
                role="menuitem"
                className="sm:hidden"
                style={{ ...menuItemStyle(false), display: "flex", textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                Apri post
              </Link>

              {isMyPost ? (
                <>
                  <button role="menuitem" style={menuItemStyle(false)} onClick={() => { onEdit(); setShowMenu(false); }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Modifica
                  </button>
                  <button role="menuitem" style={menuItemStyle(true)} onClick={() => { onDelete(); setShowMenu(false); }} disabled={isDeleting}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.07)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/>
                    </svg>
                    {isDeleting ? "Eliminazione..." : "Elimina"}
                  </button>
                </>
              ) : (
                <button role="menuitem" style={menuItemStyle(true)} onClick={() => { onReport(); setShowMenu(false); }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.07)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  Segnala
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PostCardHeader;