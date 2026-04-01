import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import api from "../services/api";
import toast from "react-hot-toast";

function PostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/posts/${postId}`);
        if (!ignore) setPost(res.data);
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || "Post non trovato");
          toast.error("Post non trovato");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchPost();
    return () => { ignore = true; };
  }, [postId]);

  const handleLikeUpdate = (postId, isLiked) =>
    setPost(prev => ({ ...prev, liked: isLiked, likeCount: isLiked ? prev.likeCount + 1 : prev.likeCount - 1 }));

  const handlePostDeleted = () => { toast.success("Post eliminato!"); navigate("/feed"); };

  if (loading) return (
    <div className="nx-page">
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <LoadingSpinner size="lg" text="Caricamento post..." />
      </div>
    </div>
  );

  if (error || !post) return (
    <div className="nx-page">
      <Navbar />
      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 16px" }}>
        <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>😕</div>
          <h2 style={{ fontWeight: 700, fontSize: "18px", color: "var(--nx-text)", marginBottom: "6px" }}>Post non trovato</h2>
          <p style={{ fontSize: "13px", color: "var(--nx-text-muted)", marginBottom: "20px" }}>Questo post potrebbe essere stato eliminato o non esiste.</p>
          <button onClick={() => navigate("/feed")} style={{ background: "var(--nx-grad-btn)", color: "#fff", border: "none", borderRadius: "var(--nx-radius-full)", padding: "10px 24px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            Torna al Feed
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="nx-page">
      <Navbar />
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 16px 60px" }}>
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--nx-text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "16px", padding: "6px 0", transition: "color var(--nx-transition)" }}
          onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-muted)"}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Indietro
        </button>
        <PostCard post={post} onLikeUpdate={handleLikeUpdate} onPostDeleted={handlePostDeleted} />
      </div>
    </div>
  );
}

export default PostPage;