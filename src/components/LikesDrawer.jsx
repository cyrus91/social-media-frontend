import { useState, useEffect } from "react";
import Drawer from "./Drawer/Drawer";
import UserListItem from "./UserListItem";
import api from "../services/api";
import toast from "react-hot-toast";

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffSecs < 60) return "Adesso";
  if (diffMins < 60) return `${diffMins}m fa`;
  if (diffHours < 24) return `${diffHours}h fa`;
  if (diffDays < 7) return `${diffDays}g fa`;
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

function LikesDrawer({ isOpen, onClose, postId, post }) {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadLikes = async (pageNum = 0) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await api.get(`/likes/post/${postId}/paginated`, { params: { page: pageNum, size: 20 } });
      const newLikes = response.data.content || [];
      if (pageNum === 0) setLikes(newLikes); else setLikes(prev => [...prev, ...newLikes]);
      setHasMore(!response.data.last);
      setPage(pageNum);
    } catch { toast.error("Errore nel caricamento dei likes"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isOpen && postId) { setLikes([]); setPage(0); setHasMore(true); loadLikes(0); }
  }, [isOpen, postId]);

  const handleScroll = (e) => {
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom && hasMore && !loading) loadLikes(page + 1);
  };

  // Post preview card
  const PostPreview = post ? (
    <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", overflow: "hidden", maxWidth: "520px" }}>
      {post.imageUrl && (
        <img src={post.imageUrl} alt="Post" style={{ width: "100%", maxHeight: "60vh", objectFit: "contain", background: "#000" }} />
      )}
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          {post.authorAvatarUrl ? (
            <img src={post.authorAvatarUrl} alt={post.authorUsername}
              style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--nx-border)" }} />
          ) : (
            <div className="nx-avatar-gradient" style={{ width: "38px", height: "38px", fontSize: "14px" }}>
              {post.authorUsername?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ fontWeight: 700, fontSize: "13px", color: "var(--nx-text)" }}>{post.authorUsername}</p>
            <p style={{ fontSize: "11px", color: "var(--nx-text-muted)" }}>{formatDate(post.createdAt)}</p>
          </div>
        </div>
        {post.content && (
          <p style={{ fontSize: "14px", color: "var(--nx-text)", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {post.content}
          </p>
        )}
      </div>
    </div>
  ) : null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Mi piace" size="md"
      showPostPreview={!!post} postContent={PostPreview}>
      <div onScroll={handleScroll} style={{ height: "100%", overflowY: "auto" }}>

        {/* Skeleton */}
        {loading && page === 0 && (
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", animation: "pulse 1.5s infinite" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--nx-surface-2)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: "12px", background: "var(--nx-surface-2)", borderRadius: "6px", width: "35%", marginBottom: "6px" }} />
                  <div style={{ height: "10px", background: "var(--nx-surface-2)", borderRadius: "6px", width: "50%" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Likes list */}
        {!loading && likes.length > 0 && (
          <div>
            {likes.map(like => (
              <UserListItem key={like.userId}
                user={{ id: like.userId, username: like.username, avatarUrl: like.avatarUrl }}
                subtitle={formatDate(like.createdAt)} />
            ))}
            {loading && page > 0 && (
              <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                <div style={{ width: "20px", height: "20px", border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              </div>
            )}
          </div>
        )}

        {/* Empty */}
        {!loading && likes.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
            <svg width="48" height="48" fill="none" stroke="var(--nx-text-subtle)" viewBox="0 0 24 24" style={{ marginBottom: "12px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p style={{ fontWeight: 700, fontSize: "15px", color: "var(--nx-text)", marginBottom: "4px" }}>Nessun like ancora</p>
            <p style={{ fontSize: "12px", color: "var(--nx-text-muted)" }}>Sii il primo a mettere like a questo post!</p>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default LikesDrawer;