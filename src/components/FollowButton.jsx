import { useState, useEffect } from "react";
import { followUser, unfollowUser, checkIfFollowing } from "../services/followService";
import toast from "react-hot-toast";

function FollowButton({ userId, username, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkIfFollowing(userId).then(result => {
      if (result.success) setIsFollowing(result.isFollowing);
      setCheckingStatus(false);
    });
  }, [userId]);

  const handleToggleFollow = async () => {
    if (loading) return;
    setLoading(true);
    const fn = isFollowing ? unfollowUser : followUser;
    const result = await fn(userId);
    if (result.success) {
      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? `Non segui più ${username}` : `Ora segui ${username}`);
      if (onFollowChange) onFollowChange(!isFollowing);
    } else { toast.error(result.error); }
    setLoading(false);
  };

  if (checkingStatus) return (
    <button disabled style={{ padding: "7px 16px", fontSize: "12px", fontWeight: 600, background: "var(--nx-surface-2)", color: "var(--nx-text-muted)", border: "1.5px solid var(--nx-border)", borderRadius: "var(--nx-radius-full)", cursor: "not-allowed" }}>
      Caricamento...
    </button>
  );

  return (
    <button onClick={handleToggleFollow} disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "7px 16px", fontSize: "12px", fontWeight: 600,
        background: isFollowing ? "rgba(124,58,237,0.08)" : "var(--nx-grad-btn)",
        color: isFollowing ? "#7c3aed" : "#fff",
        border: isFollowing ? "1.5px solid rgba(124,58,237,0.25)" : "none",
        borderRadius: "var(--nx-radius-full)", cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1, transition: "all var(--nx-transition)",
      }}>
      {loading ? (
        <>
          <div style={{ width: "12px", height: "12px", border: `2px solid ${isFollowing ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.3)"}`, borderTopColor: isFollowing ? "#7c3aed" : "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <span>{isFollowing ? "Rimozione..." : "Aggiunta..."}</span>
        </>
      ) : (
        <span>{isFollowing ? "Segui già" : "Segui"}</span>
      )}
    </button>
  );
}

export default FollowButton;