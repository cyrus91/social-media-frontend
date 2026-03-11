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

    async function loadPost() {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/posts/${postId}`);
        
        if (!ignore) {
          setPost(response.data);
        }
      } catch (err) {
        console.error("❌ Errore caricamento post:", err);
        if (!ignore) {
          setError(err.response?.data?.message || "Post non trovato");
          toast.error("Post non trovato");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadPost();

    return () => {
      ignore = true;
    };
  }, [postId]);

  const handleLikeUpdate = (postId, isLiked) => {
    setPost((prev) => ({
      ...prev,
      liked: isLiked,
      likeCount: isLiked ? prev.likeCount + 1 : prev.likeCount - 1,
    }));
  };

  const handlePostDeleted = () => {
    toast.success("Post eliminato!");
    navigate("/feed");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner size="lg" text="Caricamento post..." />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">😕</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Post non trovato
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Questo post potrebbe essere stato eliminato o non esiste.
            </p>
            <button
              onClick={() => navigate("/feed")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition">
              Torna al Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="font-semibold">Indietro</span>
        </button>

        {/* Post singolo */}
        <PostCard
          post={post}
          onLikeUpdate={handleLikeUpdate}
          onPostDeleted={handlePostDeleted}
        />
      </div>
    </div>
  );
}

export default PostPage;