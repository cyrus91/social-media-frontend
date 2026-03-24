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
      const response = await api.get(`/posts/hashtag/${tag}`, {
        params: { page: pageNum, size: 20 },
      });
      const data = response.data;
      const newPosts = data.content || [];

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setHasMore(!data.last);
      setTotalElements(data.totalElements || 0);
      setPage(pageNum);
    } catch (err) {
      console.error("Errore ricerca hashtag:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    fetchPosts(0, true);
  }, [tag]);

  const handleLikeUpdate = (postId, isLiked) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: isLiked, likeCount: isLiked ? p.likeCount + 1 : p.likeCount - 1 }
          : p
      )
    );
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setTotalElements((prev) => prev - 1);
  };

  const handlePostUpdated = (postId, updatedData) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...updatedData } : p))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">#{tag}</h1>
            {!loading && (
              <p className="text-sm text-gray-500">
                {totalElements} {totalElements === 1 ? "post" : "post"}
              </p>
            )}
          </div>
        </div>

        {/* Posts */}
        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">#️⃣</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Nessun post trovato</h2>
            <p className="text-gray-500">Nessun post contiene l'hashtag #{tag}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikeUpdate={handleLikeUpdate}
                onPostDeleted={handlePostDeleted}
                onPostUpdated={handlePostUpdated}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => fetchPosts(page + 1)}
                  disabled={loading}
                  className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-full text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50">
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