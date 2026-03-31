import { useCallback } from "react";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import CreatePostWithImages from "../components/CreatePostWithImages";
import LoadingSpinner from "../components/LoadingSpinner";
import InfiniteScrollTrigger from "../components/InfiniteScrollTrigger";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { fetchFeed } from "../services/postService";

function FeedPage() {
  const fetchFeedData = useCallback(async (page, size) => {
    return await fetchFeed(page, size);
  }, []);

  const { items: posts, loading, hasMore, error, loadMore, reset } = useInfiniteScroll(fetchFeedData, {
    pageSize: 10, initialPage: 0, enabled: true,
  });

  return (
    <div className="nx-page">
      <Navbar />

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* Create post */}
        <div className="nx-card" style={{ marginBottom: "16px", padding: "16px" }}>
          <CreatePostWithImages onPostCreated={reset} />
        </div>

        {/* Feed */}
        {posts.length === 0 && loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <LoadingSpinner />
          </div>
        ) : posts.length === 0 && !loading ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            border: "1px dashed var(--nx-border)", borderRadius: "var(--nx-radius-xl)",
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "rgba(124,58,237,0.08)", border: "1px solid var(--nx-border)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--nx-text)", marginBottom: "6px" }}>
              Il tuo feed è vuoto
            </p>
            <p style={{ fontSize: "13px", color: "var(--nx-text-muted)" }}>
              Segui altri utenti per vedere i loro post qui.
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onPostDeleted={() => reset()} />
            ))}
            {error && (
              <p style={{ textAlign: "center", color: "#ef4444", fontSize: "13px", padding: "16px" }}>
                Errore nel caricamento
              </p>
            )}
            <InfiniteScrollTrigger hasMore={hasMore} loading={loading} onLoadMore={loadMore} />
            {loading && (
              <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                <LoadingSpinner />
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p style={{ textAlign: "center", fontSize: "12px", color: "var(--nx-text-subtle)", padding: "24px 0 8px" }}>
                ✦ Sei aggiornato su tutto
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FeedPage;