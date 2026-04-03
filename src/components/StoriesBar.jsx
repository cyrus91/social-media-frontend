import { useState, useEffect, useRef, useTransition } from "react";
import { fetchFeedStories } from "../services/storyService";
import useAuthStore from "../store/authStore";
import StoryViewer from "./StoryViewer";
import StoryUploadModal from "./StoryUploadModal";

function StoriesBar() {
  const user = useAuthStore(s => s.user);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const scrollRef = useRef(null);
  const [, startTransition] = useTransition();

  const load = async () => {
    const res = await fetchFeedStories();
    // startTransition evita il warning React 19 "setState in effect"
    startTransition(() => {
      setGroups(res.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openViewer = (idx) => {
    setViewerGroupIndex(idx);
    setViewerOpen(true);
  };

  const handleStoryCreated = (newStory) => {
    setGroups(prev => {
      const ownIdx = prev.findIndex(g => g.authorId === user?.id);
      if (ownIdx >= 0) {
        const updated = [...prev];
        updated[ownIdx] = {
          ...updated[ownIdx],
          stories: [newStory, ...updated[ownIdx].stories],
          hasUnread: false,
          isOwn: true,
        };
        return updated;
      }
      return [{
        authorId: user?.id,
        authorUsername: user?.username,
        authorAvatarUrl: user?.avatarUrl,
        stories: [newStory],
        hasUnread: false,
        isOwn: true,
      }, ...prev];
    });
  };

  const handleStoryDeleted = (storyId) => {
    setGroups(prev => prev
      .map(g => ({ ...g, stories: g.stories.filter(s => s.id !== storyId) }))
      .filter(g => g.stories.length > 0)
    );
  };

  const ownGroup = groups.find(g => g.authorId === user?.id);
  const otherGroups = groups.filter(g => g.authorId !== user?.id);
  const sortedGroups = ownGroup ? [ownGroup, ...otherGroups] : groups;

  if (loading) return (
    <div style={{ padding: "12px 0", display: "flex", gap: "14px", overflowX: "auto" }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--nx-surface-2)", animation: "pulse 1.5s infinite" }} />
          <div style={{ width: "44px", height: "10px", borderRadius: "4px", background: "var(--nx-surface-2)", animation: "pulse 1.5s infinite" }} />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div ref={scrollRef}
        style={{ display: "flex", gap: "14px", overflowX: "auto", padding: "12px 0 8px", scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="hide-scrollbar">

        {/* Bottone "La tua storia" — sempre primo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0, cursor: "pointer" }}
          onClick={() => setUploadOpen(true)}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              border: "2px dashed rgba(124,58,237,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(124,58,237,0.06)",
              overflow: "hidden",
              transition: "all var(--nx-transition)",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "rgba(124,58,237,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; e.currentTarget.style.background = "rgba(124,58,237,0.06)"; }}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username}
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "var(--nx-grad-btn)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "18px", opacity: 0.7 }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Badge + */}
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "20px", height: "20px", borderRadius: "50%", background: "var(--nx-grad-btn)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--nx-bg)", color: "#fff", fontSize: "14px", fontWeight: 700, lineHeight: 1 }}>+</div>
          </div>
          <span style={{ fontSize: "11px", color: "var(--nx-text-muted)", fontWeight: 500, maxWidth: "60px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            La tua
          </span>
        </div>

        {/* Storie utenti */}
        {sortedGroups.map((group, idx) => {
          const hasUnread = group.hasUnread;
          const isOwn = group.isOwn;

          return (
            <div key={group.authorId}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0, cursor: "pointer" }}
              onClick={() => openViewer(idx)}>
              <div style={{ position: "relative" }}>
                {/* Ring */}
                <div style={{
                  width: "60px", height: "60px", borderRadius: "50%", padding: "2px",
                  background: hasUnread ? "linear-gradient(135deg,#5B21B6,#06B6D4)" : "rgba(124,58,237,0.2)",
                }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--nx-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2px" }}>
                    {group.authorAvatarUrl ? (
                      <img src={group.authorAvatarUrl} alt={group.authorUsername}
                        style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--nx-grad-btn)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "18px" }}>
                        {group.authorUsername?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                {/* Dot non letta */}
                {hasUnread && (
                  <div style={{ position: "absolute", bottom: "2px", right: "2px", width: "10px", height: "10px", borderRadius: "50%", background: "#06B6D4", border: "2px solid var(--nx-bg)" }} />
                )}
              </div>
              <span style={{ fontSize: "11px", color: "var(--nx-text-muted)", fontWeight: hasUnread ? 700 : 500, maxWidth: "60px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {isOwn ? "Tu" : group.authorUsername}
              </span>
            </div>
          );
        })}

        {groups.length === 0 && (
          <p style={{ fontSize: "12px", color: "var(--nx-text-subtle)", padding: "16px 0", alignSelf: "center" }}>
            Nessuna storia — pubblica la prima!
          </p>
        )}
      </div>

      {viewerOpen && sortedGroups.length > 0 && (
        <StoryViewer
          groups={sortedGroups}
          initialGroupIndex={viewerGroupIndex}
          onClose={() => setViewerOpen(false)}
          onStoryDeleted={handleStoryDeleted}
        />
      )}

      <StoryUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onCreated={handleStoryCreated}
      />
    </>
  );
}

export default StoriesBar;