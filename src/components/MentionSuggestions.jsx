import { useEffect, useState } from "react";

function MentionSuggestions({ suggestions, onSelect, visible, anchorRef }) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (visible && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 224) });
    }
  }, [visible, anchorRef]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <div style={{
      position: "fixed", top: coords.top, left: coords.left, width: coords.width, zIndex: 9999,
      background: "var(--nx-surface)", border: "1px solid var(--nx-border)",
      borderRadius: "var(--nx-radius-lg)", boxShadow: "var(--nx-shadow-lg)", overflow: "hidden",
    }}>
      {suggestions.map(user => (
        <button key={user.id} type="button" onMouseDown={e => { e.preventDefault(); onSelect(user.username); }}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background var(--nx-transition)" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.06)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div className="nx-avatar-gradient" style={{ width: "26px", height: "26px", fontSize: "10px", flexShrink: 0 }}>
              {user.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--nx-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            @{user.username}
          </p>
        </button>
      ))}
    </div>
  );
}

export default MentionSuggestions;