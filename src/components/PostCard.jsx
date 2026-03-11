import { useState } from "react";
import { Link } from "react-router-dom";
import { toggleLike } from "../services/postService";
import toast from "react-hot-toast";
import CommentSection from "./CommentSection";

function PostCard({ post, onLikeUpdate }) {
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);

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

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    const result = await toggleLike(post.id);

    if (!result.success) {
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount + 1 : likeCount - 1);
      toast.error("Errore nel like del post");
    } else {
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
      {/* Header - User info - ✅ RESPONSIVE! */}
      <div className="p-3 sm:p-4 flex items-center justify-between border-b border-gray-100">
        <Link
          to={`/profile/${post.authorUsername}`}
          className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition">
          {post.authorAvatarUrl ? (
            <img
              src={post.authorAvatarUrl}
              alt={`${post.authorUsername} avatar`}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-transparent hover:border-blue-500 transition"
              onError={(e) => {
                console.error("❌ Errore caricamento avatar:", post.authorAvatarUrl);
                e.target.style.display = "none";
                e.target.nextElementSibling.style.display = "flex";
              }}
            />
          ) : null}

          <div
            className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base"
            style={{ display: post.authorAvatarUrl ? "none" : "flex" }}>
            {post.authorUsername?.charAt(0).toUpperCase() || "U"}
          </div>

          <div>
            <p className="font-semibold text-gray-800 text-sm sm:text-base">
              {post.authorUsername || "Utente"}
            </p>
            <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </Link>

        <button className="text-gray-400 hover:text-gray-600 p-1">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Body - Content - ✅ RESPONSIVE! */}
      <div className="p-3 sm:p-4">
        <p className="text-gray-800 whitespace-pre-wrap break-words text-sm sm:text-base">
          {post.content}
        </p>
      </div>

      {/* Image - ✅ RESPONSIVE! */}
      {post.imageUrl && (
        <div className="relative w-full">
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full h-auto max-h-[400px] sm:max-h-[600px] object-contain bg-gray-100"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions - Like & Comment - ✅ RESPONSIVE! */}
      <div className="p-3 sm:p-4 flex items-center justify-between border-t border-b border-gray-100">
        <div className="flex items-center space-x-4 sm:space-x-6">
          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-red-500 transition disabled:opacity-50">
            <svg
              className={`w-5 h-5 sm:w-6 sm:h-6 ${
                isLiked ? "fill-red-500 text-red-500" : "fill-none"
              }`}
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="font-semibold text-sm sm:text-base">{likeCount}</span>
          </button>

          {/* Comment icon */}
          <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
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
            <span className="font-semibold text-sm sm:text-base">{commentCount}</span>
          </div>
        </div>

        {/* Share button */}
        <button className="text-gray-500 hover:text-green-500 transition p-1">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
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