import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { fetchUserProfile } from "../services/userService";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import FollowButton from "../components/FollowButton";
import api from "../services/api";
import EditProfileModal from "../components/EditProfileModal";
import { messagingService } from "../services/messagingService";
import FollowListModal from "../components/FollowListModal";

function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [likedLoading, setLikedLoading] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(null);

  const isMyProfile = currentUser?.username === username;

  const fetchPostCount = useCallback(async (userId) => {
    try {
      const response = await api.get(`/posts/author/${userId}/count`);
      setProfile((prev) => ({ ...prev, postCount: response.data.count }));
    } catch (error) {
      console.error("Errore nel caricamento del post count:", error);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchUserProfile(username);
    if (result.success) {
      setProfile(result.data);
      fetchPostCount(result.data.id);
    } else {
      setError(result.error);
      toast.error("Utente non trovato");
    }
    setLoading(false);
  }, [username, fetchPostCount]);

  useEffect(() => {
    let ignore = false;
    if (!ignore) loadProfile();
    return () => { ignore = true; };
  }, [loadProfile]);

  useEffect(() => {
    if (!profile) return;
    let ignore = false;
    async function fetchPosts() {
      setPostsLoading(true);
      try {
        const res = await api.get(`/posts/author/${profile.id}`, { params: { page: 0, size: 100 } });
        if (!ignore) { setPosts(res.data.content || []); setPostsLoading(false); }
      } catch {
        if (!ignore) { setPosts([]); setPostsLoading(false); }
      }
    }
    fetchPosts();
    return () => { ignore = true; };
  }, [profile]);

  useEffect(() => {
    if (!profile || activeTab !== "likes") return;
    let ignore = false;
    async function fetchLikedPosts() {
      setLikedLoading(true);
      try {
        const res = await api.get(`/likes/user/${profile.id}`, { params: { page: 0, size: 100 } });
        if (!ignore) setLikedPosts(res.data.content || []);
      } catch {
        if (!ignore) setLikedPosts([]);
      } finally {
        if (!ignore) setLikedLoading(false);
      }
    }
    fetchLikedPosts();
    return () => { ignore = true; };
  }, [profile, activeTab]);

  const handleLikeUpdate = (postId, isLiked) =>
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: isLiked, likeCount: isLiked ? p.likeCount + 1 : p.likeCount - 1 } : p));

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (profile?.id) fetchPostCount(profile.id);
  };

  const handlePostUpdated = (postId, updatedData) =>
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updatedData } : p));

  const formatJoinDate = (dateString) =>
    new Date(dateString).toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  const TAB_STYLE = (active) => ({
    flex: 1, padding: "12px 16px", fontSize: "13px", fontWeight: 700,
    background: "none", border: "none", cursor: "pointer",
    color: active ? "#7c3aed" : "var(--nx-text-muted)",
    borderBottom: active ? "2px solid #7c3aed" : "2px solid transparent",
    transition: "all var(--nx-transition)",
  });

  const EMPTY_CARD = (emoji, title, subtitle) => (
    <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>{emoji}</div>
      <h2 style={{ fontWeight: 700, fontSize: "16px", color: "var(--nx-text)", marginBottom: "6px" }}>{title}</h2>
      <p style={{ fontSize: "13px", color: "var(--nx-text-muted)" }}>{subtitle}</p>
    </div>
  );

  if (loading) return (
    <div className="nx-page">
      <Navbar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <LoadingSpinner size="lg" text="Caricamento profilo..." />
      </div>
    </div>
  );

  if (error || !profile) return (
    <div className="nx-page">
      <Navbar />
      <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 16px" }}>
        {EMPTY_CARD("😕", "Utente non trovato", `L'utente @${username} non esiste o è stato eliminato.`)}
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button onClick={() => navigate("/feed")} style={{
            background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff",
            border: "none", borderRadius: "var(--nx-radius-full)", padding: "10px 24px",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}>Torna al Feed</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="nx-page">
      <Navbar />

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* Profile Header Card */}
        <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", overflow: "hidden", marginBottom: "16px", boxShadow: "var(--nx-shadow-sm)" }}>

          {/* Cover */}
          <div style={{ height: "120px", background: "var(--nx-grad-brand)", position: "relative" }} />

          {/* Info section */}
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "-40px", marginBottom: "12px" }}>
              {/* Avatar */}
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.username}
                  style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--nx-surface)", boxShadow: "var(--nx-shadow)" }} />
              ) : (
                <div className="nx-avatar-gradient" style={{ width: "80px", height: "80px", fontSize: "28px", border: "3px solid var(--nx-surface)", boxShadow: "var(--nx-shadow)" }}>
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "8px", paddingBottom: "4px" }}>
                {isMyProfile ? (
                  <button onClick={() => setEditModalOpen(true)} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "7px 14px", fontSize: "12px", fontWeight: 600,
                    background: "var(--nx-surface-2)", border: "1.5px solid var(--nx-border)",
                    borderRadius: "var(--nx-radius-full)", cursor: "pointer", color: "var(--nx-text)",
                    transition: "all var(--nx-transition)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--nx-border)"}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modifica profilo
                  </button>
                ) : profile.id && (
                  <>
                    <FollowButton userId={profile.id} username={profile.username} onFollowChange={loadProfile} />
                    <button onClick={async () => {
                      try {
                        const conv = await messagingService.getOrCreateConversation(profile.id);
                        navigate(`/messages/${conv.id}`);
                      } catch { toast.error("Errore nell'apertura della chat"); }
                    }} style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "7px 14px", fontSize: "12px", fontWeight: 600,
                      background: "var(--nx-surface-2)", border: "1.5px solid var(--nx-border)",
                      borderRadius: "var(--nx-radius-full)", cursor: "pointer", color: "var(--nx-text)",
                      transition: "all var(--nx-transition)",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--nx-border)"}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z" />
                      </svg>
                      Messaggio
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Name */}
            <h1 style={{ fontWeight: 800, fontSize: "20px", color: "var(--nx-text)", marginBottom: "2px" }}>{profile.username}</h1>
            <p style={{ fontSize: "12px", color: "var(--nx-text-muted)", marginBottom: "10px" }}>@{profile.username}</p>

            {/* Bio */}
            {profile.bio && (
              <p style={{ fontSize: "14px", color: "var(--nx-text)", marginBottom: "10px", lineHeight: 1.5 }}>{profile.bio}</p>
            )}

            {/* Join date */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--nx-text-muted)", fontSize: "12px", marginBottom: "16px" }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Membro da {formatJoinDate(profile.createdAt)}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "24px" }}>
              {[
                { value: profile.postCount || 0, label: "Post", onClick: null },
                { value: profile.followerCount || 0, label: "Followers", onClick: () => setShowFollowModal("followers") },
                { value: profile.followingCount || 0, label: "Following", onClick: () => setShowFollowModal("following") },
              ].map(({ value, label, onClick }) => (
                <div key={label}
                  onClick={onClick}
                  style={{ cursor: onClick ? "pointer" : "default", textAlign: "center" }}
                  onMouseEnter={e => { if (onClick) e.currentTarget.style.opacity = "0.7"; }}
                  onMouseLeave={e => { if (onClick) e.currentTarget.style.opacity = "1"; }}>
                  <p style={{ fontWeight: 800, fontSize: "18px", color: "var(--nx-text)" }}>{value}</p>
                  <p style={{ fontSize: "11px", color: "var(--nx-text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", marginBottom: "16px", display: "flex", boxShadow: "var(--nx-shadow-sm)" }}>
          {["posts", "likes", "media"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={TAB_STYLE(activeTab === tab)}>
              {{ posts: "Post", likes: "Mi piace", media: "Media" }[tab]}
            </button>
          ))}
        </div>

        {/* Posts Tab */}
        {activeTab === "posts" && (
          postsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><LoadingSpinner /></div>
          ) : posts.length === 0 ? EMPTY_CARD("📭", "Nessun post", isMyProfile ? "Non hai ancora pubblicato nulla!" : `${profile.username} non ha ancora pubblicato nulla.`)
          : posts.map(post => (
            <PostCard key={post.id} post={post} onLikeUpdate={handleLikeUpdate} onPostDeleted={handlePostDeleted} />
          ))
        )}

        {/* Likes Tab */}
        {activeTab === "likes" && (
          likedLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><LoadingSpinner /></div>
          ) : likedPosts.length === 0 ? EMPTY_CARD("❤️", "Nessun post piaciuto", isMyProfile ? "Non hai ancora messo like a nessun post" : "Questo utente non ha ancora messo like a nessun post")
          : likedPosts.map(post => (
            <PostCard key={post.id} post={post} onLikeUpdate={handleLikeUpdate} onPostDeleted={handlePostDeleted} onPostUpdated={handlePostUpdated} />
          ))
        )}

        {/* Media Tab */}
        {activeTab === "media" && (() => {
          const mediaPosts = posts.filter(p => p.imageUrls?.length > 0);
          if (mediaPosts.length === 0) return EMPTY_CARD("🖼️", "Nessun media", isMyProfile ? "Non hai ancora pubblicato post con immagini" : "Questo utente non ha ancora pubblicato immagini");
          return (
            <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", overflow: "hidden", boxShadow: "var(--nx-shadow-sm)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
                {mediaPosts.flatMap(post => post.imageUrls.map((url, i) => (
                  <div key={`${post.id}-${i}`}
                    onClick={() => navigate(`/post/${post.id}`)}
                    style={{ position: "relative", cursor: "pointer", aspectRatio: "1", overflow: "hidden" }}>
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
                    <div style={{ position: "absolute", inset: 0, background: "transparent", transition: "background 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.35)"; e.currentTarget.querySelector(".media-stats").style.opacity = "1"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.querySelector(".media-stats").style.opacity = "0"; }}>
                      <div className="media-stats" style={{ opacity: 0, display: "flex", gap: "14px", transition: "opacity 0.3s", color: "#fff", fontWeight: 700, fontSize: "13px", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                        <span>❤️ {post.likeCount || 0}</span>
                        <span>💬 {post.commentCount || 0}</span>
                      </div>
                    </div>
                    {post.imageUrls.length > 1 && i === 0 && (
                      <div style={{ position: "absolute", top: "6px", right: "6px" }}>
                        <svg width="16" height="16" fill="white" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>
                          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM4 6v12h12V6H4zm14-2a2 2 0 012 2v12a2 2 0 01-2 2v-2h2V8h-2V4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                )))}
              </div>
            </div>
          );
        })()}
      </div>

      {isMyProfile && (
        <EditProfileModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}
          currentProfile={profile} onProfileUpdated={async () => { await loadProfile(); setEditModalOpen(false); }} />
      )}

      {showFollowModal && profile && (
        <FollowListModal isOpen userId={profile.id} username={profile.username}
          type={showFollowModal} onClose={() => setShowFollowModal(null)} />
      )}
    </div>
  );
}

export default ProfilePage;