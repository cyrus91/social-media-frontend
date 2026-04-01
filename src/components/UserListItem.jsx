import { Link } from "react-router-dom";

function UserListItem({ user, subtitle, showFollowButton = false, onFollowClick }) {
  return (
    <Link to={`/profile/${user.username}`}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", textDecoration: "none", transition: "background var(--nx-transition)" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.05)"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username}
            style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--nx-border)", flexShrink: 0 }} />
        ) : (
          <div className="nx-avatar-gradient" style={{ width: "44px", height: "44px", fontSize: "16px", flexShrink: 0 }}>
            {user.username?.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--nx-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            @{user.username}
          </p>
          {subtitle && (
            <p style={{ fontSize: "11px", color: "var(--nx-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {showFollowButton && onFollowClick && (
        <button onClick={e => { e.preventDefault(); onFollowClick(user.id); }}
          style={{ marginLeft: "10px", padding: "5px 14px", fontSize: "12px", fontWeight: 600, background: "var(--nx-grad-btn)", color: "#fff", border: "none", borderRadius: "var(--nx-radius-full)", cursor: "pointer", flexShrink: 0 }}>
          Segui
        </button>
      )}
    </Link>
  );
}

export default UserListItem;