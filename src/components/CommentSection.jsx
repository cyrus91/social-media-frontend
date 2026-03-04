import { useState, useEffect } from "react";
import {
  fetchCommentsByPost,
  createComment,
  deleteComment,
} from "../services/commentService";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

function CommentSection({
  postId,
  initialCommentCount = 0,
  onCommentCountChange,
}) {
  const user = useAuthStore((state) => state.user);

  // ============================================
  // STATE
  // ============================================
  const [comments, setComments] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  // ============================================
  // FORMAT DATE (dichiarato prima per essere usato ovunque)
  // ============================================
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Adesso";
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;

    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    });
  };

  // ============================================
  // LOAD COMMENTS (dichiarato prima del useEffect)
  // ============================================
  const loadComments = async () => {
    setLoading(true);
    const result = await fetchCommentsByPost(postId);

    if (result.success) {
      setComments(result.data);
      setCommentCount(result.data.length);

      // Notifica parent component del nuovo count
      if (onCommentCountChange) {
        onCommentCountChange(result.data.length);
      }
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  // ============================================
  // useEffect - Fetch commenti quando espandi
  // ============================================
  useEffect(() => {
    if (isExpanded && comments.length === 0) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  // ============================================
  // HANDLE SUBMIT COMMENT
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast.error("Scrivi qualcosa prima di commentare!");
      return;
    }

    // Verifica che user sia autenticato
    if (!user || !user.id) {
      toast.error("Devi essere autenticato per commentare");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createComment(postId, commentText.trim());

      if (result.success && result.data) {
        // Optimistic UI: aggiungi subito il commento
        const newComment = {
          id: result.data.id || Date.now(), // Fallback se manca id
          content: commentText.trim(),
          authorUsername: result.data.authorUsername || user.username,
          authorId: result.data.authorId || user.id,
          createdAt: result.data.createdAt || new Date().toISOString(),
          postId: postId,
        };

        setComments((prev) => [...prev, newComment]);
        setCommentCount((prev) => (prev || 0) + 1);
        setCommentText("");

        toast.success("Commento pubblicato!");

        // Notifica parent
        if (onCommentCountChange) {
          onCommentCountChange((commentCount || 0) + 1);
        }
      } else {
        toast.error(result.error || "Errore nella pubblicazione del commento");
      }
    } catch (error) {
      console.error("Errore handleSubmit:", error);
      toast.error("Errore imprevisto nella pubblicazione del commento");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // HANDLE DELETE COMMENT
  // ============================================
  const handleDelete = async (commentId) => {
    if (!window.confirm("Eliminare questo commento?")) return;

    const result = await deleteComment(commentId);

    if (result.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((prev) => prev - 1);

      toast.success("Commento eliminato");

      // Notifica parent
      if (onCommentCountChange) {
        onCommentCountChange(commentCount - 1);
      }
    } else {
      toast.error(result.error);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="border-t border-gray-100 pt-3">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 font-semibold text-sm transition">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span>
          {!commentCount || commentCount === 0
            ? "Nessun commento"
            : `${commentCount} ${commentCount === 1 ? "commento" : "commenti"}`}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded section */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Loading */}
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Comments list */}
          {!loading && comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex space-x-3 bg-gray-50 rounded-lg p-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {comment.authorUsername?.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-gray-800 text-sm">
                          {comment.authorUsername}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>

                      {/* Delete button (solo se sei l'autore) */}
                      {user?.id === comment.authorId && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-red-500 hover:text-red-600 transition"
                          title="Elimina commento">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    <p className="text-gray-700 text-sm mt-1 break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && comments.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-4">
              Nessun commento. Sii il primo a commentare!
            </p>
          )}

          {/* Add comment form */}
          <form onSubmit={handleSubmit} className="flex space-x-3">
            {/* Avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>

            {/* Input */}
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Scrivi un commento..."
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
                disabled={submitting}
              />

              <div className="flex justify-end mt-2 space-x-2">
                <button
                  type="button"
                  onClick={() => setCommentText("")}
                  disabled={submitting || !commentText}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50">
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? "Invio..." : "Pubblica"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CommentSection;
