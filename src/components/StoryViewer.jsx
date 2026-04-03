import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { markStoryViewed, fetchStoryViewers, deleteStory } from "../services/storyService";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const STORY_DURATION = 5000;

function StoryViewer({ groups, initialGroupIndex = 0, onClose, onStoryDeleted }) {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const progressRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedAtRef = useRef(0);
  const videoRef = useRef(null);
  // Set stabile per tracciare le storie già viste — no setState, no warning React 19
  const viewedIdsRef = useRef(new Set());

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const isOwn = currentGroup?.authorId === user?.id;
  const isVideo = currentStory?.mediaType === "VIDEO";

  // Segna come vista senza setState
  useEffect(() => {
    if (currentStory && !viewedIdsRef.current.has(currentStory.id)) {
      viewedIdsRef.current.add(currentStory.id);
      markStoryViewed(currentStory.id);
    }
  }, [currentStory?.id]);

  const goNext = useCallback(() => {
    const group = groups[groupIndex];
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex(i => i + 1); setProgress(0); pausedAtRef.current = 0;
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(i => i + 1); setStoryIndex(0); setProgress(0); pausedAtRef.current = 0;
    } else {
      onClose();
    }
  }, [groupIndex, storyIndex, groups, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(i => i - 1); setProgress(0); pausedAtRef.current = 0;
    } else if (groupIndex > 0) {
      setGroupIndex(i => i - 1); setStoryIndex(0); setProgress(0); pausedAtRef.current = 0;
    }
  }, [groupIndex, storyIndex]);

  // Progress bar per immagini
  useEffect(() => {
    if (!currentStory || isVideo || paused) return;
    cancelAnimationFrame(progressRef.current);
    startTimeRef.current = performance.now() - pausedAtRef.current * STORY_DURATION;
    const tick = (now) => {
      const pct = Math.min((now - startTimeRef.current) / STORY_DURATION, 1);
      setProgress(pct);
      if (pct < 1) { progressRef.current = requestAnimationFrame(tick); }
      else { goNext(); }
    };
    progressRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(progressRef.current);
  }, [currentStory?.id, paused, isVideo, goNext]);

  const handleVideoEnded = () => { setProgress(1); goNext(); };
  const handleVideoTimeUpdate = () => {
    if (videoRef.current?.duration) {
      setProgress(videoRef.current.currentTime / videoRef.current.duration);
    }
  };

  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [goNext, goPrev, onClose]);

  const touchStartX = useRef(null);
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; setPaused(true); };
  const onTouchEnd = (e) => {
    setPaused(false); pausedAtRef.current = progress;
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) { dx < 0 ? goNext() : goPrev(); }
    touchStartX.current = null;
  };

  const handleLoadViewers = async () => {
    setShowViewers(true); setLoadingViewers(true);
    const res = await fetchStoryViewers(currentStory.id);
    setViewers(res.data || []); setLoadingViewers(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Eliminare questa storia?")) return;
    const res = await deleteStory(currentStory.id);
    if (res.success) { toast.success("Storia eliminata"); onStoryDeleted?.(currentStory.id); goNext(); }
  };

  if (!currentGroup || !currentStory) return null;

  return createPortal(
    <div
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, background: "#000", overflow: "hidden" }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* ── MEDIA centrato (approccio flex semplice e affidabile) ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isVideo ? (
          <video ref={videoRef} src={currentStory.mediaUrl} autoPlay playsInline
            onEnded={handleVideoEnded} onTimeUpdate={handleVideoTimeUpdate}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        ) : (
          <img
            src={currentStory.mediaUrl}
            alt="storia"
            onLoad={() => console.log("✅ Story image loaded:", currentStory.mediaUrl)}
            onError={(e) => {
              console.error("❌ Story image FAILED:", currentStory.mediaUrl);
              // Mostra testo di fallback
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
          />
        )}
        {/* Fallback se immagine non carica */}
        <div style={{ display: "none", flexDirection: "column", alignItems: "center", gap: "12px", color: "rgba(255,255,255,0.5)" }}>
          <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p style={{ fontSize: "13px" }}>Immagine non disponibile</p>
        </div>
      </div>

      {/* ── OVERLAY centrato max 420px ── */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "420px", height: "100%", pointerEvents: "none" }}>

        {/* Gradient top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "130px", background: "linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)", zIndex: 1 }} />
        {/* Gradient bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "120px", background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)", zIndex: 1 }} />

        {/* Progress bars */}
        <div style={{ position: "absolute", top: "14px", left: "12px", right: "12px", display: "flex", gap: "4px", zIndex: 5, pointerEvents: "none" }}>
          {currentGroup.stories.map((s, i) => (
            <div key={s.id} style={{ flex: 1, height: "2.5px", borderRadius: "2px", background: "rgba(255,255,255,0.3)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "2px", background: "#fff",
                width: i < storyIndex ? "100%" : i === storyIndex ? `${progress * 100}%` : "0%",
              }} />
            </div>
          ))}
        </div>

        {/* Header autore */}
        <div style={{ position: "absolute", top: "32px", left: "12px", right: "52px", display: "flex", alignItems: "center", gap: "10px", zIndex: 5, pointerEvents: "all" }}>
          <div onClick={() => { onClose(); navigate(`/profile/${currentGroup.authorUsername}`); }} style={{ cursor: "pointer", flexShrink: 0 }}>
            {currentGroup.authorAvatarUrl ? (
              <img src={currentGroup.authorAvatarUrl} alt={currentGroup.authorUsername}
                style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #fff" }} />
            ) : (
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#5b21b6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "14px", border: "2px solid #fff" }}>
                {currentGroup.authorUsername?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "13px", color: "#fff", lineHeight: 1 }}>{currentGroup.authorUsername}</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>{formatTimeLeft(currentStory.expiresAt)}</p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={onClose}
          style={{ position: "absolute", top: "32px", right: "12px", zIndex: 5, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", pointerEvents: "all" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Caption */}
        {currentStory.caption && (
          <div style={{ position: "absolute", bottom: isOwn ? "70px" : "24px", left: "16px", right: "16px", zIndex: 5, pointerEvents: "none" }}>
            <p style={{ color: "#fff", fontSize: "14px", textShadow: "0 1px 4px rgba(0,0,0,0.8)", textAlign: "center" }}>
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Owner actions */}
        {isOwn && (
          <div style={{ position: "absolute", bottom: "20px", left: "16px", right: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 5, pointerEvents: "all" }}>
            <button onClick={handleLoadViewers}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "999px", padding: "7px 14px", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {showViewers ? viewers.length : currentStory.viewCount} visualizzazioni
            </button>
            <button onClick={handleDelete}
              style={{ background: "rgba(239,68,68,0.7)", border: "none", borderRadius: "999px", padding: "7px 14px", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              Elimina
            </button>
          </div>
        )}
      </div>

      {/* Tap zones (sopra tutto tranne i bottoni) */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "420px", height: "100%", display: "flex", zIndex: 3 }}>
        <div style={{ flex: 1, cursor: "pointer" }}
          onClick={goPrev}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => { setPaused(false); pausedAtRef.current = progress; }} />
        <div style={{ flex: 1, cursor: "pointer" }}
          onClick={goNext}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => { setPaused(false); pausedAtRef.current = progress; }} />
      </div>

      {/* Viewers panel */}
      {showViewers && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column" }}
          onClick={() => setShowViewers(false)}>
          <div style={{ marginTop: "auto", background: "var(--nx-surface)", borderRadius: "16px 16px 0 0", padding: "20px", maxHeight: "60vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontWeight: 800, fontSize: "15px", color: "var(--nx-text)" }}>Chi ha visto · {viewers.length}</h3>
              <button onClick={() => setShowViewers(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", fontSize: "18px" }}>✕</button>
            </div>
            {loadingViewers ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div style={{ width: "24px", height: "24px", border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
              </div>
            ) : viewers.length === 0 ? (
              <p style={{ textAlign: "center", fontSize: "13px", color: "var(--nx-text-muted)", padding: "20px 0" }}>
                Nessuna visualizzazione ancora
              </p>
            ) : viewers.map(v => (
              <div key={v.userId} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid var(--nx-border)" }}>
                {v.avatarUrl ? (
                  <img src={v.avatarUrl} alt={v.username} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#5b21b6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "13px" }}>
                    {v.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--nx-text)" }}>{v.username}</p>
                  <p style={{ fontSize: "11px", color: "var(--nx-text-muted)" }}>{formatViewedAt(v.viewedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frecce gruppi (desktop) */}
      {groupIndex > 0 && (
        <button onClick={() => { setGroupIndex(i => i - 1); setStoryIndex(0); setProgress(0); }}
          style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", zIndex: 10 }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {groupIndex < groups.length - 1 && (
        <button onClick={() => { setGroupIndex(i => i + 1); setStoryIndex(0); setProgress(0); }}
          style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", zIndex: 10 }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>,
    document.body
  );
}

function formatTimeLeft(expiresAt) {
  const iso = expiresAt?.endsWith("Z") ? expiresAt : expiresAt + "Z";
  const diff = new Date(iso) - new Date();
  if (diff <= 0) return "Scaduta";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h rimanenti`;
  return `${m}m rimanenti`;
}

function formatViewedAt(viewedAt) {
  const iso = viewedAt?.endsWith("Z") ? viewedAt : viewedAt + "Z";
  const diff = new Date() - new Date(iso);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h fa`;
  if (m > 0) return `${m}m fa`;
  return "Adesso";
}

export default StoryViewer;