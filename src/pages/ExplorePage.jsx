import { useCallback } from "react";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import InfiniteScrollTrigger from "../components/InfiniteScrollTrigger";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { fetchExplorePosts } from "../services/postService";
import FollowButton from "../components/FollowButton";

function ExplorePage() {
  const fetchExploreData = useCallback(async (page, size) => {
    return await fetchExplorePosts(page, size);
  }, []);

  const { items: posts, loading, hasMore, error, loadMore } = useInfiniteScroll(fetchExploreData, {
    pageSize: 10, initialPage: 0, enabled: true,
  });

  return (
    <div className="nx-page">
      <Navbar />

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--nx-text)", marginBottom: "4px" }}>
            Esplora
          </h1>
          <p style={{ fontSize: "13px", color: "var(--nx-text-muted)" }}>
            Scopri nuovi post e persone su Nexus
          </p>
        </div>

        {/* Posts */}
        {posts.length === 0 && loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {error && <p style={{ textAlign: "center", color: "#ef4444", fontSize: "13px", padding: "16px" }}>Errore caricamento</p>}
            <InfiniteScrollTrigger hasMore={hasMore} loading={loading} onLoadMore={loadMore} />
            {loading && (
              <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                <LoadingSpinner />
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p style={{ textAlign: "center", fontSize: "12px", color: "var(--nx-text-subtle)", padding: "24px 0 8px" }}>
                ✦ Hai visto tutto
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ExplorePage;