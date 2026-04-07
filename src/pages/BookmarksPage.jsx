import { useState, useEffect, useCallback, useTransition } from "react";
import { getMyBookmarks } from "../services/bookmarkService";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";

export default function BookmarksPage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [, startTransition] = useTransition();

  const loadBookmarks = useCallback(async (pageNum = 0, replace = false) => {
    startTransition(() => {
      if (pageNum === 0) setLoading(true); else setLoadingMore(true);
    });
    const res = await getMyBookmarks(pageNum, 10);
    startTransition(() => {
      if (res.success && res.data) {
        const content = res.data.content || [];
        setPosts(prev => replace ? content : [...prev, ...content]);
        setHasMore(!res.data.last);
      }
      setLoading(false);
      setLoadingMore(false);
    });
  }, []);

  useEffect(() => { loadBookmarks(0, true); }, [loadBookmarks]);

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <svg width="20" height="20" fill="#7c3aed" viewBox="0 0 24 24">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--nx-text)" }}>
            Salvati
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--nx-text-muted)" }}>
            I post che hai salvato
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <LoadingSpinner />
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "var(--nx-surface)", border: "1px solid var(--nx-border)",
          borderRadius: "var(--nx-radius-lg)"
        }}>
          <svg width="48" height="48" fill="none" stroke="var(--nx-text-subtle)" viewBox="0 0 24 24"
            style={{ margin: "0 auto 16px", display: "block" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          <p style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--nx-text)" }}>
            Nessun post salvato
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--nx-text-muted)" }}>
            Salva i post che vuoi ritrovare facilmente
          </p>
        </div>
      ) : (
        <>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
            />
          ))}

          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button
                onClick={() => { const next = page + 1; setPage(next); loadBookmarks(next); }}
                disabled={loadingMore}
                style={{
                  padding: "10px 28px", borderRadius: "999px",
                  border: "1px solid var(--nx-border)",
                  background: "var(--nx-surface)", color: "var(--nx-text)",
                  fontWeight: 600, fontSize: "14px", cursor: "pointer"
                }}>
                {loadingMore ? "Caricamento..." : "Carica altri"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}