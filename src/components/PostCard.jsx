import { useState } from "react";
import { Link } from "react-router-dom";
import { toggleLike } from "../services/postService";
import toast from "react-hot-toast";
import CommentSection from "./CommentSection";

function PostCard({ post, onLikeUpdate }) {
  // State locale per like (ottimistic UI)
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);

  // Formatta la data (es: "3h ago", "2 days ago")
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

  // Handle like/unlike
  const handleLike = async () => {
    if (isLiking) return; // Previeni click multipli

    setIsLiking(true);

    // Ottimistic UI update (aggiorna subito, prima della risposta API)
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    // Chiama API
    const result = await toggleLike(post.id);

    if (!result.success) {
      // Se fallisce, rollback
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount + 1 : likeCount - 1);
      toast.error("Errore nel like del post");
    } else {
      // Notifica il parent component (per aggiornare la lista)
      if (onLikeUpdate) {
        onLikeUpdate(post.id, !isLiked);
      }
    }

    setIsLiking(false);
  };

  const handleCommentCountChange = (newCount) => {
    setCommentCount(newCount);
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Header - User info */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <Link
          to={`/profile/${post.authorUsername}`}
          className="flex items-center space-x-3 hover:opacity-80 transition">
          
          {/* ✅ AVATAR DINAMICO - SE ESISTE USA IMMAGINE, ALTRIMENTI INIZIALE */}
          {post.authorAvatarUrl ? (
            <img
              src={post.authorAvatarUrl}
              alt={`${post.authorUsername} avatar`}
              className="w-10 h-10 rounded-full object-cover border-2 border-transparent hover:border-blue-500 transition"
              onError={(e) => {
                // Fallback se immagine non carica
                console.error("❌ Errore caricamento avatar:", post.authorAvatarUrl);
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          
          {/* Fallback iniziale (sempre presente come backup) */}
          <div 
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold"
            style={{ display: post.authorAvatarUrl ? 'none' : 'flex' }}>
            {post.authorUsername?.charAt(0).toUpperCase() || "U"}
          </div>

          {/* Username */}
          <div>
            <p className="font-semibold text-gray-800">
              {post.authorUsername || "Utente"}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(post.createdAt)}
            </p>
          </div>
        </Link>

        {/* Menu (opzionale - TODO) */}
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Body - Content */}
      <div className="p-4">
        <p className="text-gray-800 whitespace-pre-wrap break-words">
          {post.content}
        </p>

        {/* Image (se presente) */}
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post"
            className="mt-3 w-full rounded-lg object-cover max-h-96"
          />
        )}
      </div>

      {/* Footer - Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center space-x-6">
        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center space-x-2 transition ${
            isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
          }`}>
          <svg
            className="w-6 h-6"
            fill={isLiked ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="font-semibold">{likeCount}</span>
        </button>

        {/* Comment button */}
        <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition">
          <svg
            className="w-6 h-6"
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
          <span className="font-semibold">{commentCount}</span>
        </button>

        {/* Share button (placeholder) */}
        <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
      </div>

      {/* Comment Section */}
      <CommentSection
        postId={post.id}
        initialCommentCount={commentCount}
        onCommentCountChange={handleCommentCountChange}
      />
    </div>
  );
}

export default PostCard;