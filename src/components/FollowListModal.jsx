import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AvatarZoom from "./AvatarZoom";

function FollowListModal({ isOpen, onClose, userId, type }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen || !userId) return;
    let ignore = false;
    
    const fetchFollows = async () => {
      setLoading(true);
      const endpoint = type === "followers"
        ? `/follows/user/${userId}/followers`
        : `/follows/user/${userId}/following`;
      
      try {
        const res = await api.get(endpoint);
        if (!ignore) setUsers(res.data || []);
      } catch {
        if (!ignore) setUsers([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchFollows();
    return () => { ignore = true; };
  }, [isOpen, userId, type]);

  const handleUserClick = (username) => { onClose(); navigate(`/profile/${username}`); };

  if (!isOpen) return null;
  const title = type === "followers" ? "Followers" : "Following";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-xl)", boxShadow: "var(--nx-shadow-lg)", width: "100%", maxWidth: "360px", maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--nx-border)" }}>
          <h2 style={{ fontWeight: 800, fontSize: "15px", color: "var(--nx-text)" }}>{title}</h2>
          <button onClick={onClose}
            style={{ padding: "5px", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", display: "flex", transition: "all var(--nx-transition)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <div style={{ width: "22px", height: "22px", border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", fontSize: "13px", color: "var(--nx-text-muted)" }}>
              {type === "followers" ? "Nessun follower" : "Non segue nessuno"}
            </div>
          ) : users.map(follow => {
            const username = type === "followers" ? follow.followerUsername : follow.followedUsername;
            const avatarUrl = type === "followers" ? follow.followerAvatarUrl : follow.followedAvatarUrl;
            return (
              <button key={username} onClick={() => handleUserClick(username)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background var(--nx-transition)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <AvatarZoom src={avatarUrl} username={username} size="sm" />
                <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--nx-text)" }}>@{username}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FollowListModal;