import { useState, useEffect } from "react";
import {
  fetchCommentsByPost,
  createComment,
  deleteComment,
  updateComment,
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
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showMenuId, setShowMenuId] = useState(null);

  // ============================================
  // FORMAT DATE
  // ============================================
  const formatDate = (dateString) => {
    // Il backend invia LocalDateTime senza timezone (es: "2026-03-11T09:44:21.987617")
    // JavaScript lo interpreta come UTC, causando sfasamento!

    let date;

    if (dateString.includes("Z") || dateString.includes("+")) {
      // Ha già timezone (formato ISO completo)
      date = new Date(dateString);
    } else {
      // LocalDateTime senza timezone → Lo trattiamo come locale
      // Soluzione: parse come stringa e crea Date nel timezone locale
      date = new Date(dateString.replace("T", " "));
    }

    const now = new Date();

    // Calcola differenza in millisecondi
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Debug (puoi rimuovere dopo il fix)
    console.log("🕐 Comment date debug:", {
      dateString,
      parsedDate: date.toISOString(),
      now: now.toISOString(),
      diffSecs,
      diffMins,
      diffHours,
    });

    // Gestione date future (problema timezone non risolto)
    if (diffSecs < 0) {
      console.warn("⚠️ Data nel futuro - problema timezone!");
      return "Adesso";
    }

    // ✅ PRECISIONE AL SECONDO
    if (diffSecs < 10) return "Adesso";
    if (diffSecs < 60) return `${diffSecs}s fa`;
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays === 1) return "Ieri";
    if (diffDays < 7) return `${diffDays}g fa`;

    // Oltre 7 giorni: mostra data formattata
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
    });
  };

  // ============================================
  // LOAD COMMENTS
  // ============================================
  const loadComments = async () => {
    setLoading(true);
    const result = await fetchCommentsByPost(postId);

    if (result.success) {
      setComments(result.data);
      setCommentCount(result.data.length);

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

    if (!user || !user.id) {
      toast.error("Devi essere autenticato per commentare");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createComment(postId, commentText.trim());

      if (result.success && result.data) {
        const newComment = {
          id: result.data.id || Date.now(),
          content: commentText.trim(),
          authorUsername: result.data.authorUsername || user.username,
          authorId: result.data.authorId || user.id,
          authorAvatarUrl: user.avatarUrl,
          createdAt: result.data.createdAt || new Date().toISOString(),
          updatedAt: result.data.updatedAt,
          postId: postId,
        };

        setComments((prev) => [...prev, newComment]);
        setCommentCount((prev) => (prev || 0) + 1);
        setCommentText("");

        toast.success("Commento pubblicato!");

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
  // HANDLE EDIT START
  // ============================================
  const handleEditStart = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
    setShowMenuId(null);
  };

  // ============================================
  // HANDLE EDIT SAVE
  // ============================================
  const handleEditSave = async (commentId) => {
    if (!editText.trim()) {
      toast.error("Il commento non può essere vuoto");
      return;
    }

    const result = await updateComment(commentId, editText.trim());

    if (result.success) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                content: editText.trim(),
                updatedAt: new Date().toISOString(),
              }
            : c,
        ),
      );
      setEditingCommentId(null);
      setEditText("");
      toast.success("Commento modificato");
    } else {
      toast.error(result.error || "Errore nella modifica");
    }
  };

  // ============================================
  // HANDLE EDIT CANCEL
  // ============================================
  const handleEditCancel = () => {
    setEditingCommentId(null);
    setEditText("");
  };

  // ============================================
  // HANDLE DELETE COMMENT
  // ============================================
  const handleDelete = async (commentId) => {
    if (!window.confirm("Eliminare questo commento?")) return;

    setShowMenuId(null);

    const result = await deleteComment(commentId);

    if (result.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((prev) => prev - 1);

      toast.success("Commento eliminato");

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
        <div className="mt-3 space-y-3">
          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Comments list */}
          {!loading && comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex space-x-3 bg-gray-50 rounded-lg p-3 relative group">
                  {/* Avatar */}
                  {comment.authorAvatarUrl ? (
                    <img
                      src={comment.authorAvatarUrl}
                      alt={comment.authorUsername}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-transparent hover:border-green-500 transition"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                  ) : null}

                  <div
                    className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{
                      display: comment.authorAvatarUrl ? "none" : "flex",
                    }}>
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
                        {(() => {
                          if (!comment.updatedAt) return null;
                          const created = new Date(comment.createdAt).getTime();
                          const updated = new Date(comment.updatedAt).getTime();
                          // Differenza superiore a 1 secondo = è stato modificato
                          return updated - created > 1000 ? (
                            <span className="text-xs text-gray-400 italic">
                              (modificato)
                            </span>
                          ) : null;
                        })()}
                      </div>

                      {/* Menu 3 pallini (solo se sei l'autore) */}
                      {user?.id === comment.authorId && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowMenuId(
                                showMenuId === comment.id ? null : comment.id,
                              )
                            }
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition opacity-0 group-hover:opacity-100">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>

                          {/* Dropdown Menu */}
                          {showMenuId === comment.id && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-200">
                              <button
                                onClick={() => handleEditStart(comment)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center space-x-2">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                <span>Modifica</span>
                              </button>
                              <button
                                onClick={() => handleDelete(comment.id)}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 transition flex items-center space-x-2">
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
                                <span>Elimina</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Commento normale o in edit */}
                    {editingCommentId === comment.id ? (
                      <div className="mt-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
                          rows="2"
                          autoFocus
                        />
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            onClick={() => handleEditSave(comment.id)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition">
                            Salva
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition">
                            Annulla
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 text-sm mt-1 break-words">
                        {comment.content}
                      </p>
                    )}
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
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-blue-500"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Input */}
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Scrivi un commento..."
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
              />

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? "Invio..." : "Commenta"}
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
