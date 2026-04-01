import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";

function HashtagPage() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  const fetchPosts = async (pageNum = 0, reset = false) => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/hashtag/${tag}`, { params: { page: pageNum, size: 20 } });
      const data = res.data;
      const newPosts = data.content || [];
      if (reset) setPosts(newPosts); else setPosts(prev => [...prev, ...newPosts]);
      setHasMore(!data.last);
      setTotalElements(data.totalElements || 0);
      setPage(pageNum);
    } catch (err) { console.error("Errore ricerca hashtag:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { setPosts([]); setPage(0); setHasMore(true); fetchPosts(0, true); }, [tag]);

  const handleLikeUpdate = (postId, isLiked) =>
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: isLiked, likeCount: isLiked ? p.likeCount + 1 : p.likeCount - 1 } : p));
  const handlePostDeleted = (postId) => { setPosts(prev => prev.filter(p => p.id !== postId)); setTotalElements(prev => prev - 1); };
  const handlePostUpdated = (postId, updatedData) =>
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updatedData } : p));

  return (
    <div className="nx-page">
      <Navbar />
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* Header */}
        <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", padding: "14px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "var(--nx-shadow-sm)" }}>
          <button onClick={() => navigate(-1)}
            style={{ padding: "6px", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", display: "flex", transition: "all var(--nx-transition)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "18px", color: "var(--nx-text)" }}>#{tag}</h1>
            {!loading && <p style={{ fontSize: "12px", color: "var(--nx-text-muted)" }}>{totalElements} post</p>}
          </div>
        </div>

        {/* Posts */}
        {loading && posts.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><LoadingSpinner /></div>
        ) : posts.length === 0 ? (
          <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>#️⃣</div>
            <h2 style={{ fontWeight: 700, fontSize: "16px", color: "var(--nx-text)", marginBottom: "6px" }}>Nessun post trovato</h2>
            <p style={{ fontSize: "13px", color: "var(--nx-text-muted)" }}>Nessun post contiene l'hashtag #{tag}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onLikeUpdate={handleLikeUpdate} onPostDeleted={handlePostDeleted} onPostUpdated={handlePostUpdated} />
            ))}
            {hasMore && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: "16px" }}>
                <button onClick={() => fetchPosts(page + 1)} disabled={loading}
                  style={{ background: "var(--nx-surface)", border: "1.5px solid var(--nx-border)", color: "var(--nx-text-muted)", padding: "8px 24px", borderRadius: "var(--nx-radius-full)", fontSize: "13px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, transition: "all var(--nx-transition)" }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; e.currentTarget.style.color = "#7c3aed"; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--nx-border)"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
                  {loading ? "Caricamento..." : "Carica altri"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HashtagPage;