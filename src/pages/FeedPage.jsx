import { useCallback } from "react";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import CreatePostWithImages from "../components/CreatePostWithImages";
import LoadingSpinner from "../components/LoadingSpinner";
import InfiniteScrollTrigger from "../components/InfiniteScrollTrigger";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { fetchFeed } from "../services/postService";

function FeedPage() {
  //  FETCH FUNCTION per infinite scroll (MEMOIZZATA!)
  const fetchFeedData = useCallback(async (page, size) => {
    console.log(`📥 Fetching feed page ${page}`);
    return await fetchFeed(page, size);
  }, []);

  //  USA HOOK INFINITE SCROLL
  const {
    items: posts,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
  } = useInfiniteScroll(fetchFeedData, {
    pageSize: 10,
    initialPage: 0,
    enabled: true,
  });

  // Handle post creato
  const handleNewPost = () => {
    console.log(" Nuovo post creato - ricarico feed");
    reset();
  };

  // Handle like update
  const handleLikeUpdate = (postId, isLiked) => {
    console.log(`❤️ Post ${postId} - liked: ${isLiked}`);
  };

  // Loading iniziale (prima pagina)
  if (posts.length === 0 && loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner size="lg" text="Caricamento feed..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-2xl mx-auto p-4 mt-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Errore caricamento feed
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={reset}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition">
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePostDeleted = (postId) => {
    console.log(`🗑️ Post ${postId} eliminato - rimuovo dalla lista`);
    // Non serve fare nulla, il reset() ricaricherà il feed
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        {/* Header */}
        <div className="mb-4 sm:mb-6 mt-4 sm:mt-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Home 🏠
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Post degli utenti che segui
          </p>
        </div>

        {/* Create Post Form */}
        <div className="mb-6">
          <CreatePostWithImages onPostCreated={handleNewPost} />
        </div>

        {/* Posts List */}
        {posts.length === 0 && !loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Nessun post nel feed
            </h2>
            <p className="text-gray-600 mb-6">
              Inizia a seguire qualcuno per vedere i loro post qui!
            </p>
            <a
              href="/explore"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition">
              Esplora Utenti
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikeUpdate={handleLikeUpdate}
                onPostDeleted={handlePostDeleted}
              />
            ))}

            {/*  INFINITE SCROLL TRIGGER */}
            <InfiniteScrollTrigger
              onIntersect={loadMore}
              loading={loading}
              hasMore={hasMore}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedPage;
