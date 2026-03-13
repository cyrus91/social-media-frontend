import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toggleLike, deletePost } from "../services/postService";
import toast from "react-hot-toast";
import CommentSection from "./CommentSection";
import useAuthStore from "../store/authStore";
import ImageCarousel from "./ImageCarousel";
import Lightbox from "./Lightbox";
import LikesDrawer from "./LikesDrawer";
import api from "../services/api";
import EditPostModal from "./EditPostModal";

function PostCard({ post, onLikeUpdate, onPostDeleted, onPostUpdated }) {
  const currentUser = useAuthStore((state) => state.user);
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLikesDrawer, setShowLikesDrawer] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [showEditModal, setShowEditModal] = useState(false);

  // CHECK SE È IL MIO POST
  const isMyPost = currentUser?.username === post.authorUsername;

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

  // Aggiungo useEffect per tracciare cambiamenti
  useEffect(() => {
    console.log("🔄 LocalPost aggiornato:", {
      id: localPost.id,
      imageCount: localPost.imageUrls?.length || 0,
      images: localPost.imageUrls,
    });
  }, [localPost]);

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

  // HANDLE DELETE POST
  const handleDeletePost = async () => {
    const confirmed = window.confirm(
      "Sei sicuro di voler eliminare questo post? Questa azione non può essere annullata.",
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setShowMenu(false);

    const result = await deletePost(post.id);

    if (result.success) {
      toast.success("Post eliminato con successo!");

      // Notifica il parent per rimuovere il post dalla lista
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } else {
      toast.error(result.error || "Errore nell'eliminazione del post");
    }

    setIsDeleting(false);
  };

  // HANDLE EDIT POST
  const handleEditPost = () => {
    setShowEditModal(true);
    setShowMenu(false);
  };

  const handlePostUpdated = (updatedPost) => {
    console.log("Post aggiornato ricevuto:", updatedPost);

    // Aggiorna completamente localPost
    setLocalPost(updatedPost);

    // Chiudi modal
    setShowEditModal(false);

    // Toast di conferma
    toast.success("Post aggiornato!");
  };

  // HANDLE SAVE EDIT
  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error("Il post non può essere vuoto");
      return;
    }

    try {
      await api.put(`/posts/${post.id}`, {
        content: editContent.trim(),
      });

      toast.success("Post modificato!");

      // ✅ Notifica il parent
      if (onPostUpdated) {
        onPostUpdated(post.id, { content: editContent.trim() });
      }

      setLocalPost({ ...localPost, content: editContent.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Errore modifica post:", error);
      toast.error(
        error.response?.data?.message || "Errore nella modifica del post",
      );
    }
  };

  // ✅ HANDLE CANCEL EDIT
  const handleCancelEdit = () => {
    setEditContent(localPost.content || "");
    setIsEditing(false);
  };

  // ✅ HANDLE REPORT POST
  const handleReportPost = () => {
    setShowMenu(false);
    toast("Segnalazione post - Coming soon!", { icon: "🚧" });
    // TODO: Implementare sistema di segnalazione
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
                console.error(
                  "❌ Errore caricamento avatar:",
                  post.authorAvatarUrl,
                );
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
            <p className="text-xs text-gray-500">
              {formatDate(post.createdAt)}
            </p>
          </div>
        </Link>

        {/* ✅ LINK "VEDI POST" + MENU 3 PALLINI */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Link "Vedi post" - visibile solo su desktop */}
          <Link
            to={`/post/${post.id}`}
            className="text-blue-500 hover:text-blue-600 transition text-xs sm:text-sm font-semibold hidden sm:flex items-center space-x-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span>Apri</span>
          </Link>

          {/* Menu 3 pallini */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                {isMyPost ? (
                  <>
                    {/* ✅ AGGIUNGI "Vedi post" ANCHE NEL MENU (per mobile) */}
                    <Link
                      to={`/post/${post.id}`}
                      onClick={() => setShowMenu(false)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center space-x-2 sm:hidden">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      <span>Vedi post</span>
                    </Link>

                    {/* Modifica (TODO) */}
                    <button
                      onClick={handleEditPost}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center space-x-2">
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

                    {/* Elimina */}
                    <button
                      onClick={handleDeletePost}
                      disabled={isDeleting}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition flex items-center space-x-2 disabled:opacity-50">
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
                      <span>{isDeleting ? "Eliminazione..." : "Elimina"}</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* ✅ AGGIUNGI "Vedi post" ANCHE PER POST ALTRUI (per mobile) */}
                    <Link
                      to={`/post/${post.id}`}
                      onClick={() => setShowMenu(false)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center space-x-2 sm:hidden">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      <span>Vedi post</span>
                    </Link>

                    {/* Segnala (TODO) */}
                    <button
                      onClick={handleReportPost}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition flex items-center space-x-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span>Segnala</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body - Content */}
      <div className="p-3 sm:p-4">
        {isEditing ? (
          // ✅ MODALITÀ EDIT
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition">
                Salva
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition">
                Annulla
              </button>
            </div>
          </div>
        ) : (
          // ✅ VISUALIZZAZIONE NORMALE
          <p className="text-gray-800 whitespace-pre-wrap break-words text-sm sm:text-base">
            {localPost.content}
          </p>
        )}
      </div>

      {/* Images - Supporta sia imageUrls (nuovo) che imageUrl (vecchio) */}
      {((localPost.imageUrls && localPost.imageUrls.length > 0) ||
        localPost.imageUrl) && (
        <>
          <ImageCarousel
            key={`carousel-${localPost.id}-${localPost.imageUrls?.length || 0}`} // FORZA RE-RENDER
            images={
              localPost.imageUrls && localPost.imageUrls.length > 0
                ? localPost.imageUrls
                : [localPost.imageUrl]
            }
            onImageClick={(index) => {
              setLightboxIndex(index);
              setLightboxOpen(true);
            }}
          />

          {/* Lightbox custom */}
          {lightboxOpen && (
            <Lightbox
              images={
                localPost.imageUrls && localPost.imageUrls.length > 0
                  ? localPost.imageUrls
                  : [localPost.imageUrl]
              }
              initialIndex={lightboxIndex}
              onClose={() => setLightboxOpen(false)}
            />
          )}
        </>
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
            <span className="font-semibold text-sm sm:text-base">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // BLOCCA PROPAGAZIONE
                  e.preventDefault(); // PREVIENI DEFAULT
                  setShowLikesDrawer(true);
                }}
                className="text-sm font-semibold text-gray-800 hover:text-blue-500 transition">
                {likeCount} {likeCount === 1 ? "like" : "likes"}
              </button>
            </span>
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
            <span className="font-semibold text-sm sm:text-base">
              {commentCount}
            </span>
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

      {/* Likes Drawer */}
      <LikesDrawer
        isOpen={showLikesDrawer}
        onClose={() => setShowLikesDrawer(false)}
        postId={post.id}
        post={post}
      />
      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={localPost}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  );
}

export default PostCard;
