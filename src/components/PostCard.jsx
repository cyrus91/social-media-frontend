import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { renderTextWithHashtags } from "../utils/hashtagUtils";
import { toggleLike, deletePost, viewPost } from "../services/postService";
import { toggleBookmark } from "../services/bookmarkService";
import { votePoll, updatePoll } from "../services/pollService";
import toast from "react-hot-toast";
import CommentSection from "./CommentSection";
import useAuthStore from "../store/authStore";
import ImageCarousel from "./ImageCarousel";
import Lightbox from "./Lightbox";
import LikesDrawer from "./LikesDrawer";
import EditPostModal from "./EditPostModal";
import AvatarZoom from "./AvatarZoom";
import ReportModal from "./ReportModal";

function PostCard({ post, onLikeUpdate, onPostDeleted }) {
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLikesDrawer, setShowLikesDrawer] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareRef = useRef(null);
  const [viewCount, setViewCount] = useState(post.viewCount ?? 0);
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarked || false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const cardRef = useRef(null);
  const menuRef = useRef(null);
  const isMyPost = currentUser?.username === post.authorUsername;

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
      if (shareRef.current && !shareRef.current.contains(e.target)) setShowShareMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // View counter — una sola view per utente per post (persistita in localStorage 24h)
  useEffect(() => {
    if (!currentUser || isMyPost) return;
    const el = cardRef.current;
    if (!el) return;

    const storageKey = `nx_viewed_${currentUser.id}`;
    const getViewed = () => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        // Pulisce le entry scadute (> 24h)
        const now = Date.now();
        const cleaned = Object.fromEntries(
          Object.entries(parsed).filter(([, ts]) => now - ts < 86400000)
        );
        return cleaned;
      } catch { return {}; }
    };

    const alreadyViewed = () => {
      const viewed = getViewed();
      return !!viewed[post.id];
    };

    const markViewed = () => {
      const viewed = getViewed();
      viewed[post.id] = Date.now();
      localStorage.setItem(storageKey, JSON.stringify(viewed));
    };

    if (alreadyViewed()) return; // già visto, non osservare

    let timer = null;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        timer = setTimeout(() => {
          if (!alreadyViewed()) {
            markViewed();
            viewPost(post.id);
            setViewCount(c => c + 1);
          }
        }, 1000);
      } else {
        clearTimeout(timer);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [post.id, isMyPost, currentUser]);

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
    return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    const result = await toggleLike(post.id);
    if (!result.success) {
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount + 1 : likeCount - 1);
    } else if (onLikeUpdate) onLikeUpdate(post.id, !isLiked);
    setIsLiking(false);
  };

  const handleBookmark = async () => {
    if (isBookmarking) return;
    setIsBookmarking(true);
    const newState = !isBookmarked;
    setIsBookmarked(newState);
    const result = await toggleBookmark(post.id);
    if (!result.success) {
      setIsBookmarked(!newState);
    } else {
      toast.success(newState ? "Salvato nei bookmark" : "Rimosso dai bookmark");
    }
    setIsBookmarking(false);
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    const result = await deletePost(post.id);
    if (result.success) { toast.success("Post eliminato!"); if (onPostDeleted) onPostDeleted(post.id); }
    else toast.error(result.error || "Errore eliminazione");
    setIsDeleting(false);
  };

  const handlePostUpdated = (updatedPost) => {
    setLocalPost(updatedPost);
    setShowEditModal(false);
    toast.success("Post aggiornato!");
  };

  const handleReportPost = () => {
    setShowMenu(false);
    setShowReportModal(true);
  };

  // ─── Stili condivisi ───────────────────────────────────────
  const menuItemStyle = (danger) => ({
    width: "100%", display: "flex", alignItems: "center", gap: "10px",
    padding: "9px 14px", fontSize: "13px", fontWeight: 500, background: "none",
    border: "none", cursor: "pointer", textAlign: "left", borderRadius: "var(--nx-radius-sm)",
    color: danger ? "#ef4444" : "var(--nx-text)", transition: "background var(--nx-transition)",
  });

  const actionBtnStyle = (active) => ({
    display: "flex", alignItems: "center", gap: "6px",
    padding: "7px 10px", borderRadius: "var(--nx-radius-sm)",
    fontSize: "13px", fontWeight: 600, background: "none", border: "none",
    cursor: "pointer", transition: "all var(--nx-transition)",
    color: active ? "#7c3aed" : "var(--nx-text-muted)",
  });

  return (
    <>
      <article ref={cardRef} className="nx-card" style={{ marginBottom: "12px", transition: "border-color var(--nx-transition), box-shadow var(--nx-transition)" }}>

        {/* ── Header ── */}
        <div style={{ padding: "14px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--nx-border)" }}>
          <Link to={`/profile/${post.authorUsername}`}
            style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <AvatarZoom src={post.authorAvatarUrl} username={post.authorUsername} size="md" />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--nx-text)", lineHeight: 1.2 }}>
                {post.authorUsername}
              </p>
              <p style={{ fontSize: "11px", color: "var(--nx-text-subtle)", marginTop: "2px" }}>
                {formatDate(post.createdAt)}
              </p>
            </div>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Apri post — desktop */}
            <Link to={`/post/${post.id}`}
              className="hidden sm:flex"
              style={{
                display: "none", alignItems: "center", gap: "5px",
                fontSize: "12px", fontWeight: 600, color: "var(--nx-text-muted)",
                textDecoration: "none", padding: "5px 10px",
                border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-sm)",
                transition: "all var(--nx-transition)"
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#7c3aed"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.35)"; e.currentTarget.style.background = "rgba(124,58,237,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--nx-text-muted)"; e.currentTarget.style.borderColor = "var(--nx-border)"; e.currentTarget.style.background = "none"; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              Apri
            </Link>

            {/* Menu 3 punti */}
            <div ref={menuRef} style={{ position: "relative" }}>
              <button onClick={() => setShowMenu(!showMenu)}
                style={{
                  padding: "5px", borderRadius: "var(--nx-radius-sm)", background: "none",
                  border: "none", cursor: "pointer", color: "var(--nx-text-subtle)",
                  transition: "all var(--nx-transition)", display: "flex"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-subtle)"; }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>

              {showMenu && (
                <div className="nx-animate-in" style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)", width: "180px",
                  background: "var(--nx-surface)", border: "1px solid var(--nx-border)",
                  borderRadius: "var(--nx-radius-lg)", boxShadow: "var(--nx-shadow-lg)",
                  zIndex: 50, padding: "6px", overflow: "hidden"
                }}>
                  {/* Apri — mobile */}
                  <Link to={`/post/${post.id}`} onClick={() => setShowMenu(false)}
                    className="sm:hidden"
                    style={{ ...menuItemStyle(false), display: "flex", textDecoration: "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    Apri post
                  </Link>

                  {isMyPost ? (
                    <>
                      <button style={menuItemStyle(false)} onClick={() => { setShowEditModal(true); setShowMenu(false); }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.06)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        Modifica
                      </button>
                      <button style={menuItemStyle(true)} onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }} disabled={isDeleting}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.07)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/>
                        </svg>
                        {isDeleting ? "Eliminazione..." : "Elimina"}
                      </button>
                    </>
                  ) : (
                    <button style={menuItemStyle(true)} onClick={handleReportPost}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.07)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      Segnala
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "14px 16px" }}>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: "var(--nx-text)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {renderTextWithHashtags(localPost.content, navigate)}
          </p>
        </div>

        {/* ── Images ── */}
        {((localPost.imageUrls?.length > 0) || localPost.imageUrl) && (
          <>
            <ImageCarousel
              key={`carousel-${localPost.id}-${localPost.imageUrls?.length || 0}`}
              images={localPost.imageUrls?.length > 0 ? localPost.imageUrls : [localPost.imageUrl]}
              onImageClick={(index) => { setLightboxIndex(index); setLightboxOpen(true); }}
            />
            {lightboxOpen && (
              <Lightbox
                images={localPost.imageUrls?.length > 0 ? localPost.imageUrls : [localPost.imageUrl]}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
              />
            )}
          </>
        )}

        {/* ── Poll widget ── */}
        {localPost.poll && <PollWidget
          poll={localPost.poll}
          isAuthor={isMyPost}
          onUpdate={(updatedPoll) => setLocalPost(prev => ({ ...prev, poll: updatedPoll }))}
          onVote={async (optionId) => {
            // Aggiornamento ottimistico — decrementa il vecchio voto se presente
            setLocalPost(prev => {
              if (!prev.poll) return prev;
              const wasVoted = prev.poll.votedOptionId;
              const newOptions = prev.poll.options.map(o => {
                let count = o.voteCount || 0;
                if (o.id === optionId) count += 1;
                if (wasVoted && o.id === wasVoted) count = Math.max(0, count - 1);
                return { ...o, voteCount: count };
              });
              const total = newOptions.reduce((sum, o) => sum + o.voteCount, 0);
              const withPct = newOptions.map(o => ({
                ...o,
                percentage: total > 0 ? (o.voteCount * 100.0 / total) : 0
              }));
              return {
                ...prev,
                poll: { ...prev.poll, options: withPct, totalVotes: total, votedOptionId: optionId }
              };
            });
            // Chiama il backend
            const res = await votePoll(localPost.poll.id, optionId);
            if (res.success && res.data) {
              // Sovrascrive con la risposta reale del server (percentuali precise)
              setLocalPost(prev => ({ ...prev, poll: res.data }));
            } else if (!res.success) {
              toast.error("Errore nel voto");
            }
          }}
        />}

        {/* ── Actions ── */}
        <div style={{
          padding: "8px 12px", display: "flex", alignItems: "center",
          borderTop: "1px solid var(--nx-border)", gap: "4px"
        }}>
          {/* Like */}
          <button onClick={handleLike} disabled={isLiking} style={actionBtnStyle(isLiked)}
            onMouseEnter={e => { if (!isLiked) { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.07)"; } }}
            onMouseLeave={e => { if (!isLiked) { e.currentTarget.style.color = "var(--nx-text-muted)"; e.currentTarget.style.background = "none"; } }}>
            <svg width="18" height="18" viewBox="0 0 24 24"
              fill={isLiked ? "#ef4444" : "none"} stroke={isLiked ? "#ef4444" : "currentColor"} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            <button onClick={(e) => { e.stopPropagation(); setShowLikesDrawer(true); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "inherit", padding: 0 }}>
              {likeCount}
            </button>
          </button>

          {/* Comment */}
          <button onClick={() => setShowComments(!showComments)} style={actionBtnStyle(showComments)}
            onMouseEnter={e => { if (!showComments) { e.currentTarget.style.color = "#7c3aed"; e.currentTarget.style.background = "rgba(124,58,237,0.07)"; } }}
            onMouseLeave={e => { if (!showComments) { e.currentTarget.style.color = "var(--nx-text-muted)"; e.currentTarget.style.background = "none"; } }}>
            <svg width="18" height="18" viewBox="0 0 24 24"
              fill={showComments ? "rgba(124,58,237,0.15)" : "none"} stroke={showComments ? "#7c3aed" : "currentColor"} strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            {commentCount}
          </button>

          {/* Views */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--nx-text-muted)", padding: "6px 8px" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            {viewCount}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            disabled={isBookmarking}
            style={actionBtnStyle(isBookmarked)}
            onMouseEnter={e => { if (!isBookmarked) { e.currentTarget.style.color = "#7c3aed"; e.currentTarget.style.background = "rgba(124,58,237,0.07)"; } }}
            onMouseLeave={e => { if (!isBookmarked) { e.currentTarget.style.color = "var(--nx-text-muted)"; e.currentTarget.style.background = "none"; } }}>
            <svg width="17" height="17" viewBox="0 0 24 24"
              fill={isBookmarked ? "#7c3aed" : "none"}
              stroke={isBookmarked ? "#7c3aed" : "currentColor"} strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>

          {/* Share */}
          <div ref={shareRef} style={{ position: "relative" }}>
            <button
              onClick={() => {
                const url = `${window.location.origin}/post/${post.id}`;
                if (navigator.share) {
                  navigator.share({ title: "Post su Nexus", text: post.content?.slice(0, 80) || "", url }).catch(() => {});
                } else {
                  setShowShareMenu(s => !s);
                }
              }}
              style={actionBtnStyle(showShareMenu)}
              onMouseEnter={e => { if (!showShareMenu) { e.currentTarget.style.color = "#0891b2"; e.currentTarget.style.background = "rgba(8,145,178,0.07)"; } }}
              onMouseLeave={e => { if (!showShareMenu) { e.currentTarget.style.color = "var(--nx-text-muted)"; e.currentTarget.style.background = "none"; } }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Condividi
            </button>

            {showShareMenu && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 8px)", right: 0,
                background: "var(--nx-surface)", border: "1px solid var(--nx-border)",
                borderRadius: "var(--nx-radius)", boxShadow: "var(--nx-shadow-lg)",
                minWidth: "200px", overflow: "hidden", zIndex: 50
              }}>
                {[
                  {
                    label: "Copia link",
                    icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
                    action: () => {
                      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
                        .then(() => toast.success("Link copiato!"))
                        .catch(() => toast.error("Impossibile copiare"));
                      setShowShareMenu(false);
                    }
                  },
                  {
                    label: "WhatsApp",
                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.857L0 24l6.335-1.521A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.655-.502-5.188-1.381l-.372-.213-3.763.904.951-3.668-.234-.386A9.946 9.946 0 012 12C2 6.478 6.478 2 12 2s10 4.478 10 10-4.478 10-10 10z"/></svg>,
                    action: () => {
                      window.open(`https://wa.me/?text=${encodeURIComponent(`${window.location.origin}/post/${post.id}`)}`, "_blank");
                      setShowShareMenu(false);
                    }
                  },
                  {
                    label: "X (Twitter)",
                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
                    action: () => {
                      const url = encodeURIComponent(`${window.location.origin}/post/${post.id}`);
                      const text = encodeURIComponent(post.content?.slice(0, 100) || "Guarda questo post su Nexus");
                      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
                      setShowShareMenu(false);
                    }
                  }
                ].map(({ label, icon, action }) => (
                  <button key={label} onClick={action}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text)", fontSize: "13px", fontWeight: 500, textAlign: "left" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <span style={{ color: "var(--nx-text-muted)", display: "flex" }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Comments ── */}
        {showComments && (
          <div style={{ borderTop: "1px solid var(--nx-border)", padding: "4px 16px 16px" }}>
            <CommentSection
              postId={post.id}
              initialCommentCount={commentCount}
              onCommentCountChange={setCommentCount}
              defaultExpanded={true}
            />
          </div>
        )}
      </article>

      {/* Likes Drawer */}
      <LikesDrawer isOpen={showLikesDrawer} onClose={() => setShowLikesDrawer(false)} postId={post.id} post={post} />

      {/* Edit Modal */}
      <EditPostModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} post={localPost} onPostUpdated={handlePostUpdated} />
      {showReportModal && <ReportModal postId={post.id} onClose={() => setShowReportModal(false)} />}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 60,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
        }}>
          <div className="nx-card nx-animate-in" style={{ width: "100%", maxWidth: "360px", padding: "28px 24px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/>
              </svg>
            </div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, textAlign: "center", marginBottom: "8px", color: "var(--nx-text)" }}>
              Elimina post
            </h3>
            <p style={{ fontSize: "13px", color: "var(--nx-text-muted)", textAlign: "center", marginBottom: "24px", lineHeight: 1.5 }}>
              Sei sicuro? Questa azione non può essere annullata.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="nx-btn nx-btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
                Annulla
              </button>
              <button onClick={handleDeletePost} disabled={isDeleting}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "6px", padding: "10px", borderRadius: "var(--nx-radius)", fontSize: "14px",
                  fontWeight: 600, border: "none", cursor: "pointer",
                  background: "#ef4444", color: "#fff", opacity: isDeleting ? 0.6 : 1
                }}>
                {isDeleting ? <><div className="nx-spinner" />Eliminazione...</> : "Elimina"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PollWidget({ poll, onVote, onUpdate, isAuthor }) {
  const [editMode, setEditMode] = useState(false);
  const [editQuestion, setEditQuestion] = useState(poll.question);
  const [editOptions, setEditOptions] = useState(poll.options.map(o => o.text));
  const [saving, setSaving] = useState(false);
  const [isChangingVote, setIsChangingVote] = useState(false);
  const [prevPollKey, setPrevPollKey] = useState(() => `${poll.id}-${poll.question}-${poll.options.length}`);

  // Sincronizza gli stati interni quando il prop poll cambia (es. dopo onUpdate)
  const pollKey = `${poll.id}-${poll.question}-${poll.options.length}`;
  if (pollKey !== prevPollKey) {
    setPrevPollKey(pollKey);
    setEditQuestion(poll.question);
    setEditOptions(poll.options.map(o => o.text));
  }

  const hasVoted = poll.votedOptionId != null;
  const showResults = (hasVoted && !isChangingVote) || poll.expired;
  const canEdit = isAuthor && poll.totalVotes === 0 && !poll.expired;

  const formatExpiry = () => {
    if (poll.expired) return "Sondaggio terminato";
    const diff = new Date(poll.expiresAt) - new Date();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d} giorn${d === 1 ? "o" : "i"} rimanent${d === 1 ? "e" : "i"}`;
    if (h > 0) return `${h} or${h === 1 ? "a" : "e"} rimanent${h === 1 ? "e" : "i"}`;
    return "Meno di 1 ora";
  };

  const handleSaveEdit = async () => {
    const validOpts = editOptions.filter(o => o.trim());
    if (!editQuestion.trim() || validOpts.length < 2) {
      toast.error("Inserisci una domanda e almeno 2 opzioni");
      return;
    }
    setSaving(true);
    const res = await updatePoll(poll.id, { question: editQuestion.trim(), options: validOpts });
    setSaving(false);
    if (res.success) {
      onUpdate(res.data);
      setEditMode(false);
    } else if (res.hasVotes) {
      toast.error("Non puoi modificare un sondaggio con voti");
    } else {
      toast.error("Errore nel salvataggio");
    }
  };

  if (editMode) {
    return (
      <div style={{ padding: "14px 16px", borderTop: "1px solid var(--nx-border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--nx-text)" }}>✏️ Modifica sondaggio</span>
          <button onClick={() => setEditMode(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", fontSize: "18px" }}>✕</button>
        </div>
        <input value={editQuestion} onChange={e => setEditQuestion(e.target.value)} maxLength={300}
          style={{ width: "100%", padding: "8px 12px", background: "var(--nx-input-bg)", border: "1.5px solid var(--nx-input-border)", borderRadius: "var(--nx-radius)", color: "var(--nx-text)", fontSize: "13px", marginBottom: "8px", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
          onFocus={e => e.target.style.borderColor = "#7c3aed"}
          onBlur={e => e.target.style.borderColor = "var(--nx-input-border)"} />
        {editOptions.map((opt, i) => (
          <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "6px", alignItems: "center" }}>
            <input value={opt} onChange={e => setEditOptions(prev => prev.map((o, idx) => idx === i ? e.target.value : o))} maxLength={150}
              placeholder={`Opzione ${i + 1}`}
              style={{ flex: 1, padding: "7px 12px", background: "var(--nx-input-bg)", border: "1.5px solid var(--nx-input-border)", borderRadius: "var(--nx-radius)", color: "var(--nx-text)", fontSize: "13px", outline: "none", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "var(--nx-input-border)"} />
            {editOptions.length > 2 && (
              <button onClick={() => setEditOptions(prev => prev.filter((_, idx) => idx !== i))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-subtle)", fontSize: "16px" }}>✕</button>
            )}
          </div>
        ))}
        {editOptions.length < 4 && (
          <button onClick={() => setEditOptions(prev => [...prev, ""])}
            style={{ width: "100%", padding: "6px", background: "none", border: "1.5px dashed rgba(124,58,237,0.25)", borderRadius: "var(--nx-radius)", color: "#7c3aed", fontSize: "12px", fontWeight: 600, cursor: "pointer", marginBottom: "10px" }}>
            + Aggiungi opzione
          </button>
        )}
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <button onClick={() => setEditMode(false)}
            style={{ flex: 1, padding: "8px", borderRadius: "var(--nx-radius)", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "var(--nx-text)", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
            Annulla
          </button>
          <button onClick={handleSaveEdit} disabled={saving}
            style={{ flex: 1, padding: "8px", borderRadius: "var(--nx-radius)", background: "var(--nx-grad-btn)", border: "none", color: "#fff", fontWeight: 600, fontSize: "13px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 16px", borderTop: "1px solid var(--nx-border)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
        <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--nx-text)", margin: 0, flex: 1 }}>
          📊 {poll.question}
        </p>
        {canEdit && (
          <button onClick={() => setEditMode(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", padding: "0 0 0 8px", flexShrink: 0 }}
            title="Modifica sondaggio"
            onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-muted)"}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {poll.options.map(opt => (
          <div key={opt.id}>
            {showResults ? (
              <div style={{ position: "relative", borderRadius: "var(--nx-radius)", overflow: "hidden", border: `1.5px solid ${poll.votedOptionId === opt.id ? "#7c3aed" : "var(--nx-border)"}`, background: "var(--nx-surface-2)" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${opt.percentage}%`, background: poll.votedOptionId === opt.id ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.07)", transition: "width 0.5s ease" }} />
                <div style={{ position: "relative", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: poll.votedOptionId === opt.id ? 700 : 400, color: poll.votedOptionId === opt.id ? "#7c3aed" : "var(--nx-text)" }}>
                    {poll.votedOptionId === opt.id && "✓ "}{opt.text}
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--nx-text-muted)" }}>{Math.round(opt.percentage)}%</span>
                </div>
              </div>
            ) : (
              <button onClick={() => { onVote(opt.id); setIsChangingVote(false); }}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--nx-radius)", border: "1.5px solid var(--nx-border)", background: "var(--nx-surface-2)", color: "var(--nx-text)", fontSize: "13px", cursor: "pointer", textAlign: "left", transition: "all var(--nx-transition)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "rgba(124,58,237,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--nx-border)"; e.currentTarget.style.background = "var(--nx-surface-2)"; }}>
                {opt.text}
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
        <p style={{ fontSize: "11px", color: "var(--nx-text-subtle)", margin: 0 }}>
          {poll.totalVotes} vot{poll.totalVotes === 1 ? "o" : "i"} · {formatExpiry()}
        </p>
        {hasVoted && !poll.expired && !isChangingVote && (
          <button
            onClick={() => setIsChangingVote(true)}
            style={{ fontSize: "11px", color: "var(--nx-text-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-subtle)"}>
            Cambia voto
          </button>
        )}
        {isChangingVote && (
          <button
            onClick={() => setIsChangingVote(false)}
            style={{ fontSize: "11px", color: "var(--nx-text-subtle)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-subtle)"}>
            Annulla
          </button>
        )}
      </div>
    </div>
  );
}

export default PostCard;