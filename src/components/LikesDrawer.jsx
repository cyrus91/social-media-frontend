import { useState, useEffect } from "react";
import Drawer from "./Drawer/Drawer";
import UserListItem from "./UserListItem";
import api from "../services/api";
import toast from "react-hot-toast";

function LikesDrawer({ isOpen, onClose, postId, post }) {  // ✅ AGGIUNGI post prop
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // ============================================
  // LOAD LIKES
  // ============================================
  const loadLikes = async (pageNum = 0) => {
    if (loading) return;

    setLoading(true);

    try {
      const response = await api.get(`/likes/post/${postId}/paginated`, {
        params: {
          page: pageNum,
          size: 20,
        },
      });

      const newLikes = response.data.content || [];

      if (pageNum === 0) {
        setLikes(newLikes);
      } else {
        setLikes((prev) => [...prev, ...newLikes]);
      }

      setHasMore(!response.data.last);
      setPage(pageNum);
    } catch (error) {
      console.error("❌ Errore caricamento likes:", error);
      toast.error("Errore nel caricamento dei likes");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOAD ON OPEN
  // ============================================
  useEffect(() => {
    if (isOpen && postId) {
      setLikes([]);
      setPage(0);
      setHasMore(true);
      loadLikes(0);
    }
  }, [isOpen, postId]);

  // ============================================
  // INFINITE SCROLL
  // ============================================
  const handleScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;

    if (bottom && hasMore && !loading) {
      loadLikes(page + 1);
    }
  };

  // ============================================
  // POST PREVIEW COMPONENT
  // ============================================
  const PostPreview = post ? (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-lg">
      {/* Post Image (se esiste) */}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post"
          className="w-full max-h-[60vh] object-contain bg-black"
        />
      )}

      {/* Post Content */}
      <div className="p-6">
        {/* Author */}
        <div className="flex items-center space-x-3 mb-4">
          {post.authorAvatarUrl ? (
            <img
              src={post.authorAvatarUrl}
              alt={post.authorUsername}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {post.authorUsername?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-800">{post.authorUsername}</p>
            <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-gray-800 whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}
      </div>
    </div>
  ) : null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Mi piace"
      size="md"
      showPostPreview={!!post}  // ✅ Abilita preview se post esiste
      postContent={PostPreview}>  // ✅ Passa post preview
      
      <div onScroll={handleScroll} className="h-full overflow-y-auto">
        {/* Loading Skeleton */}
        {loading && page === 0 && (
          <div className="space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Likes List */}
        {!loading && likes.length > 0 && (
          <div>
            {likes.map((like) => (
              <UserListItem
                key={like.userId}
                user={{
                  id: like.userId,
                  username: like.username,
                  avatarUrl: like.avatarUrl,
                }}
                subtitle={formatDate(like.createdAt)}
              />
            ))}

            {/* Loading More */}
            {loading && page > 0 && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && likes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg font-semibold mb-2">
              Nessun like ancora
            </p>
            <p className="text-gray-400 text-sm">
              Sii il primo a mettere like a questo post!
            </p>
          </div>
        )}
      </div>
    </Drawer>
  );
}

// ============================================
// FORMAT DATE
// ============================================
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

  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
}

export default LikesDrawer;