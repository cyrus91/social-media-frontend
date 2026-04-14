import { useState, useEffect } from "react";
import {
  fetchCommentsByPost,
  createComment,
  toggleCommentReaction,
  createCommentWithImage,
} from "../services/commentService";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";

function CommentSection({ postId, initialCommentCount = 0, onCommentCountChange, defaultExpanded = false }) {
  const user = useAuthStore(state => state.user);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  useEffect(() => {
    if (!isExpanded) return;
    let ignore = false;
    const load = async () => {
      setLoading(true);
      const res = await fetchCommentsByPost(postId);
      if (!ignore) {
        // Normalizza myReaction→userReaction e reactions Map→reactionCount
        const normalize = (c) => ({
          ...c,
          userReaction: c.myReaction ?? c.userReaction ?? null,
          reactionCount: c.reactions ? Object.values(c.reactions).reduce((s, v) => s + v, 0) : (c.reactionCount ?? 0),
          replies: (c.replies || []).map(r => ({
            ...r,
            userReaction: r.myReaction ?? r.userReaction ?? null,
            reactionCount: r.reactions ? Object.values(r.reactions).reduce((s, v) => s + v, 0) : (r.reactionCount ?? 0),
          }))
        });
        setComments(res.success ? (res.data || []).map(normalize) : []);
        setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [isExpanded, postId]);

  const handleReact = async (commentId, reaction) => {
    const res = await toggleCommentReaction(commentId, reaction);
    if (res.success && res.data) {
      // CommentResponse usa: myReaction (String) e reactions (Map<String,Long>)
      const reactionCount = res.data.reactions
        ? Object.values(res.data.reactions).reduce((sum, v) => sum + v, 0)
        : 0;
      const updatedFields = { userReaction: res.data.myReaction, reactionCount };
      setComments(prev => prev.map(c => {
        if (c.id === commentId) return { ...c, ...updatedFields };
        if (c.replies) {
          return { ...c, replies: c.replies.map(r => r.id === commentId ? { ...r, ...updatedFields } : r) };
        }
        return c;
      }));
    }
  };

  const handleNewComment = async (text, imageFile) => {
    if (!text.trim() && !imageFile) return false;
    setSubmitting(true);
    let res;
    if (imageFile) {
      res = await createCommentWithImage({ postId, content: text.trim(), parentId: null, imageFile });
    } else {
      res = await createComment({ postId, content: text.trim(), parentId: null });
    }
    if (res.success) {
      setComments(prev => [...prev, res.data]);
      const newCount = commentCount + 1;
      setCommentCount(newCount);
      onCommentCountChange?.(newCount);
      toast.success("Commento pubblicato");
      setSubmitting(false);
      return true;
    }
    toast.error(res.error || "Errore nell'invio del commento");
    setSubmitting(false);
    return false;
  };

  const handleReplyCreated = () => {
    const newCount = commentCount + 1;
    setCommentCount(newCount);
    onCommentCountChange?.(newCount);
  };

  return (
    <section aria-label={`Commenti — ${commentCount} commento${commentCount !== 1 ? "i" : ""}`}>
      {/* Toggle */}
      {!defaultExpanded && (
        <button
          onClick={() => setIsExpanded(s => !s)}
          aria-expanded={isExpanded}
          aria-controls={`comments-${postId}`}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "var(--nx-text-muted)", padding: "8px 0", transition: "color var(--nx-transition)" }}
          onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-muted)"}
        >
          {isExpanded ? "Nascondi commenti" : `Vedi ${commentCount > 0 ? commentCount : ""} comment${commentCount !== 1 ? "i" : "o"}`}
        </button>
      )}

      {/* Lista commenti */}
      {isExpanded && (
        <div id={`comments-${postId}`}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
              <div style={{ width: "20px", height: "20px", border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--nx-text-subtle)", textAlign: "center", padding: "16px 0" }}>
              Ancora nessun commento. Sii il primo!
            </p>
          ) : (
            <div style={{ marginBottom: "8px" }}>
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  user={user}
                  postId={postId}
                  onReact={handleReact}
                  onReplyCreated={handleReplyCreated}
                />
              ))}
            </div>
          )}

          {/* Form nuovo commento */}
          {user && (
            <CommentForm
              user={user}
              onSubmit={handleNewComment}
              submitting={submitting}
            />
          )}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </section>
  );
}

export default CommentSection;