import { useState, useEffect, useRef } from "react";
import { useMentionInput } from "../hooks/useMentionInput";
import MentionSuggestions from "./MentionSuggestions";
import MentionTextarea from "./MentionTextarea";
import { renderTextWithMentions } from "../utils/renderTextWithMentions";
import { Link } from "react-router-dom";
import EmojiPickerButton from "./EmojiPickerButton";
import AvatarZoom from "./AvatarZoom";
import {
  fetchCommentsByPost,
  createComment,
  deleteComment,
  updateComment,
  toggleCommentReaction,
  createCommentWithImage,
  deleteCommentImage,
} from "../services/commentService";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

// Mappa emoji → etichetta per il bottone "Mi piace"
const REACTION_LABELS = { "❤️": "Adoro", "👍": "Mi piace", "😂": "Haha", "😮": "Wow", "😢": "Triste", "🙏": "Grazie" };

// Componente reaction button stile Facebook
function ReactionButton({ comment, onReact, disabled }) {
  const [showPicker, setShowPicker] = useState(false);
  const openTimer = useRef(null);
  const closeTimer = useRef(null);

  const myReaction = comment.myReaction;
  const label = myReaction ? (REACTION_LABELS[myReaction] || "Mi piace") : "Mi piace";
  const isLiked = !!myReaction;

  const cancelClose = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setShowPicker(false), 400);
  };

  const handleButtonMouseEnter = () => {
    cancelClose();
    openTimer.current = setTimeout(() => setShowPicker(true), 400);
  };
  const handleButtonMouseLeave = () => {
    clearTimeout(openTimer.current);
    scheduleClose();
  };
  const handlePickerMouseEnter = () => {
    cancelClose();
  };
  const handlePickerMouseLeave = () => {
    scheduleClose();
  };

  // Mobile: long press
  const touchTimer = useRef(null);
  const handleTouchStart = () => {
    touchTimer.current = setTimeout(() => setShowPicker(true), 500);
  };
  const handleTouchEnd = () => clearTimeout(touchTimer.current);

  const handleClick = () => {
    if (showPicker) { setShowPicker(false); return; }
    onReact(comment.id, myReaction || "❤️");
  };

  return (
    <div className="relative inline-block">
      {/* Picker animato */}
      {showPicker && (
        <div
          style={{ position:"absolute", bottom:"36px", left:0, background:"var(--nx-surface)", border:"1px solid var(--nx-border)", borderRadius:"var(--nx-radius-full)", boxShadow:"var(--nx-shadow-lg)", display:"flex", alignItems:"center", padding:"6px 12px", gap:"4px", zIndex:30, animation:"slideUp 0.15s ease-out" }}
          onMouseEnter={handlePickerMouseEnter}
          onMouseLeave={handlePickerMouseLeave}>
          {REACTIONS.map((emoji, i) => (
            <button key={emoji}
              onClick={(e) => { e.stopPropagation(); setShowPicker(false); onReact(comment.id, emoji); }}
              className="text-2xl hover:scale-150 transition-transform duration-100 cursor-pointer"
              style={{ transitionDelay: `${i * 20}ms` }}
              title={REACTION_LABELS[emoji]}>
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bottone Mi piace */}
      <button
        onClick={handleClick}
        onMouseEnter={e => { handleButtonMouseEnter(); e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
        onMouseLeave={e => { handleButtonMouseLeave(); e.currentTarget.style.background = "none"; e.currentTarget.style.color = isLiked ? "#7c3aed" : "var(--nx-text-muted)"; }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
        style={{
          display: "flex", alignItems: "center", gap: "4px",
          fontSize: "11px", fontWeight: 700, padding: "3px 8px",
          borderRadius: "var(--nx-radius-sm)", border: "none", cursor: "pointer",
          background: "none", transition: "all var(--nx-transition)",
          color: isLiked ? "#7c3aed" : "var(--nx-text-muted)",
          opacity: disabled ? 0.5 : 1,
        }}>
        <span style={{ fontSize: "13px" }}>{myReaction || "👍"}</span>
        <span>{label}</span>
      </button>
    </div>
  );
}

// Componente singolo commento (usato sia per principali che per risposte)
function CommentItem({ comment, user, postId, onReact, onReplyCreated, depth = 0 }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyImageFile, setReplyImageFile] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const replyImageInputRef = useRef(null);
  const replyInputRef = useRef(null);
  const { handleChange: handleReplyMentionChange, selectMention: selectReplyMention,
          suggestions: replySuggestions, showSuggestions: showReplySuggestions } =
    useMentionInput(replyText, setReplyText);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);
  const [localComment, setLocalComment] = useState(comment);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Aggiorna il commento ma preserva myReaction/reactions locali se già settati
    // (evita che il re-render del parent cancelli le reaction appena messe)
    setLocalComment(prev => ({
      ...comment,
      myReaction: prev.myReaction !== undefined ? prev.myReaction : comment.myReaction,
      reactions: (prev.reactions && Object.keys(prev.reactions).length > 0)
        ? prev.reactions
        : comment.reactions,
    }));
  }, [comment]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const iso = String(dateString).includes("Z") || String(dateString).includes("+") ? dateString : dateString + "Z";
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "Adesso";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return "Ieri";
    return `${diffDays}g`;
  };

  const handleSubmitReply = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!replyText.trim() && !replyImageFile) return;
    setSubmittingReply(true);
    try {
      let result;
      if (replyImageFile) {
        result = await createCommentWithImage({ postId, content: replyText.trim() || null, parentId: comment.id, imageFile: replyImageFile });
      } else {
        result = await createComment({ postId, content: replyText.trim(), parentId: comment.id });
      }
      if (result.success) {
        const newReply = {
          ...result.data,
          authorAvatarUrl: user.avatarUrl,
          reactions: {},
          myReaction: null,
          replies: [],
        };
        setLocalComment(prev => ({
          ...prev,
          replies: [...(prev.replies || []), newReply]
        }));
        setReplyText("");
        setReplyImageFile(null);
        setReplyImagePreview(null);
        setShowReplyForm(false);
        if (onReplyCreated) onReplyCreated();
        toast.success("Risposta inviata!");
      }
    } catch { toast.error("Errore"); }
    finally { setSubmittingReply(false); }
  };

  const handleEditSave = async () => {
    if (!editText.trim()) return;
    try {
      const result = await updateComment(comment.id, editText.trim());
      if (result.success) {
        setLocalComment(prev => ({ ...prev, content: editText.trim() }));
        setEditMode(false);
        toast.success("Commento modificato");
      }
    } catch { toast.error("Errore"); }
  };

  const handleDelete = async () => {
    try {
      await deleteComment(comment.id);
      setLocalComment(prev => ({ ...prev, content: null }));
      toast.success("Commento eliminato");
    } catch { toast.error("Errore"); } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleReact = async (commentId, emoji) => {
    const normalize = (e) => e?.replace(/\uFE0F/g, "").trim() ?? null;
    const prevMyReaction = localComment.myReaction;
    const isSame = normalize(prevMyReaction) === normalize(emoji);

    // Optimistic update immediato
    setLocalComment(prev => ({ ...prev, myReaction: isSame ? null : emoji }));

    const result = await toggleCommentReaction(commentId, emoji);
    if (result.success) {
      // Sincronizza con dato reale dal server
      setLocalComment(prev => ({
        ...prev,
        reactions: result.data.reactions,
        myReaction: result.data.myReaction,
      }));
    } else {
      // Rollback
      setLocalComment(prev => ({ ...prev, myReaction: prevMyReaction }));
    }
  };

  if (localComment.content === null) return null;

  return (
    <>
    <div className={`flex space-x-2 ${depth > 0 ? "ml-8 mt-2" : ""}`}>
      <div className="flex-shrink-0">
        <Link to={`/profile/${localComment.authorUsername}`}>
          <AvatarZoom src={localComment.authorAvatarUrl} username={localComment.authorUsername} size="sm" />
        </Link>
      </div>

      <div className="flex-1 min-w-0">
        {/* Bubble commento */}
        <div style={{ background: "var(--nx-surface-2)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", padding: "8px 12px", display: "inline-block", maxWidth: "100%", position: "relative" }} className="group/comment">
          <Link to={`/profile/${localComment.authorUsername}`}
            style={{ fontWeight: 700, fontSize: "12px", color: "var(--nx-text)", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
            {localComment.authorUsername}
          </Link>

          {editMode ? (
            <div style={{ marginTop: "4px" }}>
              <textarea value={editText} onChange={e => setEditText(e.target.value)}
                style={{ width: "100%", fontSize: "13px", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-sm)", padding: "6px 8px", outline: "none", resize: "none", color: "var(--nx-text)" }}
                rows={2} autoFocus />
              <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                <button onClick={handleEditSave}
                  style={{ fontSize: "11px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", padding: "3px 10px", borderRadius: "var(--nx-radius-sm)", border: "none", cursor: "pointer" }}>
                  Salva
                </button>
                <button onClick={() => setEditMode(false)}
                  style={{ fontSize: "11px", background: "var(--nx-surface)", color: "var(--nx-text-muted)", padding: "3px 10px", borderRadius: "var(--nx-radius-sm)", border: "1px solid var(--nx-border)", cursor: "pointer" }}>
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: "13px", color: "var(--nx-text)", marginTop: "2px", wordBreak: "break-word" }}>{renderTextWithMentions(localComment.content)}</p>
              {/* Immagine allegata al commento */}
              {localComment.imageUrl && (
                <div style={{ position: "relative", display: "inline-block", marginTop: "6px" }}>
                  <img src={localComment.imageUrl} alt="img"
                    style={{ maxHeight: "180px", borderRadius: "var(--nx-radius)", objectFit: "cover", cursor: "pointer", border: "1px solid var(--nx-border)" }}
                    onClick={() => window.open(localComment.imageUrl, "_blank")} />
                  {user?.id === localComment.authorId && (
                    <button type="button"
                      onClick={async () => {
                        const res = await deleteCommentImage(localComment.id);
                        if (res.success) {
                          setLocalComment(prev => ({ ...prev, imageUrl: null }));
                          toast.success("Immagine rimossa");
                        }
                      }}
                      style={{ position: "absolute", top: "4px", right: "4px", width: "20px", height: "20px", background: "#ef4444", color: "#fff", borderRadius: "50%", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
                      ✕
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Menu 3 punti — solo autore */}
          {user?.id === localComment.authorId && !editMode && (
            <div style={{ position: "absolute", top: "4px", right: "4px", opacity: 0, transition: "opacity var(--nx-transition)" }} className="group-hover/comment:opacity-100">
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowMenu(v => !v)}
                  style={{ padding: "3px", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-subtle)", display: "flex" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--nx-surface)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {showMenu && (
                  <div style={{ position: "absolute", right: 0, top: "24px", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius)", boxShadow: "var(--nx-shadow-lg)", padding: "4px", zIndex: 50, width: "110px" }}>
                    <button onClick={() => { setEditMode(true); setShowMenu(false); }}
                      style={{ width: "100%", textAlign: "left", padding: "6px 10px", fontSize: "12px", color: "var(--nx-text)", background: "none", border: "none", cursor: "pointer", borderRadius: "var(--nx-radius-sm)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      ✏️ Modifica
                    </button>
                    <button onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                      style={{ width: "100%", textAlign: "left", padding: "6px 10px", fontSize: "12px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", borderRadius: "var(--nx-radius-sm)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      🗑️ Elimina
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reazioni esistenti */}
        {localComment.reactions && Object.keys(localComment.reactions).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px", marginLeft: "4px" }}>
            {Object.entries(localComment.reactions).map(([emoji, count]) => (
              <button key={emoji}
                onClick={() => handleReact(localComment.id, emoji)}
                style={{
                  fontSize: "11px", borderRadius: "var(--nx-radius-full)",
                  padding: "2px 8px", display: "flex", alignItems: "center", gap: "2px",
                  border: `1px solid ${localComment.myReaction === emoji ? "rgba(124,58,237,0.4)" : "var(--nx-border)"}`,
                  background: localComment.myReaction === emoji ? "rgba(124,58,237,0.1)" : "var(--nx-surface)",
                  color: "var(--nx-text-muted)", cursor: "pointer",
                  transition: "all var(--nx-transition)",
                }}>
                <span>{emoji}</span>
                <span style={{ fontWeight: 600 }}>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Azioni sotto commento */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", marginLeft: "4px" }}>
          <ReactionButton comment={localComment} onReact={handleReact} disabled={!user} />

          {depth === 0 && user && (
            <button onClick={() => setShowReplyForm(v => !v)}
              style={{ fontSize: "11px", fontWeight: 700, color: "var(--nx-text-muted)", background: "none", border: "none", cursor: "pointer", transition: "color var(--nx-transition)" }}
              onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-muted)"}>
              Rispondi
            </button>
          )}

          <span style={{ fontSize: "11px", color: "var(--nx-text-subtle)" }}>{formatDate(localComment.createdAt)}</span>
        </div>

        {/* Form risposta */}
        {showReplyForm && (
          <div style={{ marginTop: "8px" }}>
            {/* Preview immagine reply */}
            {replyImagePreview && (
              <div style={{ position: "relative", display: "inline-block", marginLeft: "32px", marginBottom: "6px" }}>
                <img src={replyImagePreview} alt="preview"
                  style={{ maxHeight: "80px", borderRadius: "var(--nx-radius)", objectFit: "cover", border: "1px solid var(--nx-border)" }} />
                <button type="button"
                  onClick={() => { setReplyImageFile(null); setReplyImagePreview(null); }}
                  style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", background: "#ef4444", color: "#fff", borderRadius: "50%", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
                  ✕
                </button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ flexShrink: 0 }}>
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} alt="" />
                  : <div className="nx-avatar-gradient" style={{ width: "24px", height: "24px", fontSize: "9px" }}>
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>}
              </div>
              <div style={{ flex: 1, background: "var(--nx-surface-2)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", padding: "6px 12px", position: "relative" }}>
                <MentionSuggestions
                  suggestions={replySuggestions}
                  visible={showReplySuggestions}
                  onSelect={(u) => selectReplyMention(u, replyInputRef)}
                  anchorRef={replyInputRef}
                />
                <MentionTextarea
                  textareaRef={replyInputRef}
                  value={replyText}
                  onChange={e => { setReplyText(e.target.value); handleReplyMentionChange(e); }}
                  placeholder={`Rispondi a @${localComment.authorUsername}...`}
                  rows={1}
                  className="w-full"
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                    <EmojiPickerButton onEmojiSelect={emoji => setReplyText(p => p + emoji)} />
                    <button type="button"
                      onClick={() => replyImageInputRef.current?.click()}
                      title="Aggiungi foto"
                      style={{ padding: "4px", color: "var(--nx-text-subtle)", background: "none", border: "none", cursor: "pointer", display: "flex", borderRadius: "50%" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-subtle)"}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <button type="button"
                    onClick={handleSubmitReply}
                    disabled={(!replyText.trim() && !replyImageFile) || submittingReply}
                    style={{ color: "#7c3aed", background: "none", border: "none", cursor: "pointer", opacity: (!replyText.trim() && !replyImageFile) ? 0.4 : 1, display: "flex" }}>
                    <svg width="16" height="16" style={{ transform: "rotate(45deg)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => { setShowReplyForm(false); setReplyImageFile(null); setReplyImagePreview(null); }}
                style={{ color: "var(--nx-text-subtle)", fontSize: "12px", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>✕</button>
            </div>
            {/* Input foto nascosto per reply */}
            <input ref={replyImageInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { toast.error("Immagine troppo grande (max 5MB)"); return; }
                setReplyImageFile(file);
                const reader = new FileReader();
                reader.onload = () => setReplyImagePreview(reader.result);
                reader.readAsDataURL(file);
                e.target.value = "";
              }} />
          </div>
        )}

        {/* Risposte annidate */}
        {localComment.replies && localComment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {localComment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} user={user}
                postId={postId} onReact={onReact} depth={1} />
            ))}
          </div>
        )}
      </div>
    </div>

      {/* Modal conferma eliminazione commento */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setShowDeleteConfirm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Elimina commento</h3>
              <p className="text-sm text-gray-500">Il commento verrà eliminato definitivamente.</p>
              <div className="flex w-full space-x-3 pt-2">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition">
                  Annulla
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition">
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// COMPONENTE PRINCIPALE
// ============================================
function CommentSection({ postId, initialCommentCount = 0, defaultExpanded = false }) {
  const user = useAuthStore(state => state.user);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { handleChange: handleMentionChange, selectMention: selectMainMention, suggestions: mainSuggestions, showSuggestions: showMainSuggestions } = useMentionInput(commentText, setCommentText);

  useEffect(() => {
    if (isExpanded) loadComments();
  }, [isExpanded, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const result = await fetchCommentsByPost(postId);
      if (result.success) setComments(result.data?.content || result.data || []);
    } catch { /* silenzioso */ }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !imageFile) return;
    if (!user) return;
    setSubmitting(true);
    try {
      let result;
      if (imageFile) {
        result = await createCommentWithImage({ postId, content: commentText.trim() || null, imageFile });
      } else {
        result = await createComment({ postId, content: commentText.trim() });
      }
      if (result.success) {
        const newComment = {
          ...result.data,
          authorAvatarUrl: user.avatarUrl,
          reactions: {},
          myReaction: null,
          replies: [],
        };
        setComments(prev => [...prev, newComment]);
        setCommentCount(prev => prev + 1);
        setCommentText("");
        setImageFile(null);
        setImagePreview(null);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        toast.success("Commento pubblicato!");
      }
    } catch { toast.error("Errore"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="mt-3">
      {/* Toggle */}
      {!defaultExpanded && (
        <button onClick={() => setIsExpanded(v => !v)}
          className="text-sm text-gray-500 hover:text-blue-500 transition font-medium flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{commentCount > 0 ? `${commentCount} commenti` : "Commenta"}</span>
        </button>
      )}

      {(isExpanded || defaultExpanded) && (
        <div className="mt-3 space-y-3">
          {loading && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && comments.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-2">Nessun commento ancora.</p>
          )}

          {!loading && comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} user={user}
              postId={postId} depth={0} />
          ))}

          {/* Form nuovo commento */}
          {user && (
            <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "flex-start", gap: "8px", paddingTop: "12px", borderTop: "1px solid var(--nx-border)" }}>
              <div style={{ flexShrink: 0 }}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} alt="" />
                  : <div className="nx-avatar-gradient" style={{ width: "32px", height: "32px", fontSize: "11px" }}>
                      {user.username?.charAt(0).toUpperCase()}
                    </div>}
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <MentionSuggestions suggestions={mainSuggestions} visible={showMainSuggestions} onSelect={(u) => selectMainMention(u, textareaRef)} anchorRef={textareaRef} />
                <div style={{
                  border: `1.5px solid ${commentText ? "rgba(124,58,237,0.4)" : "var(--nx-border)"}`,
                  borderRadius: "var(--nx-radius-lg)",
                  background: "var(--nx-surface-2)",
                  boxShadow: commentText ? "0 0 0 3px rgba(124,58,237,0.08)" : "none",
                  transition: "border-color var(--nx-transition), box-shadow var(--nx-transition)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", padding: "6px 12px", gap: "8px" }}>
                    {!(commentText || imageFile) && (
                      <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
                        <EmojiPickerButton onEmojiSelect={emoji => setCommentText(p => p + emoji)} />
                        <button type="button"
                          onClick={() => imageInputRef.current?.click()}
                          title="Aggiungi foto"
                          style={{ padding: "4px", color: "var(--nx-text-subtle)", background: "none", border: "none", cursor: "pointer", display: "flex", borderRadius: "50%", transition: "color var(--nx-transition)" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
                          onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-subtle)"}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <MentionTextarea
                      textareaRef={textareaRef}
                      value={commentText}
                      onChange={e => {
                        setCommentText(e.target.value);
                        handleMentionChange(e);
                        const ta = textareaRef.current;
                        if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 120) + "px"; }
                      }}
                      placeholder="Scrivi un commento..."
                      rows={1}
                      className="flex-1"
                    />
                  </div>
                  {/* Preview immagine */}
                  {imagePreview && (
                    <div style={{ padding: "0 12px 8px", position: "relative", display: "inline-block" }}>
                      <img src={imagePreview} alt="preview"
                        style={{ maxHeight: "120px", borderRadius: "var(--nx-radius)", objectFit: "cover", border: "1px solid var(--nx-border)" }} />
                      <button type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        style={{ position: "absolute", top: "4px", right: "4px", width: "18px", height: "18px", background: "#ef4444", color: "#fff", borderRadius: "50%", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
                        ✕
                      </button>
                    </div>
                  )}
                  {(commentText || imageFile) && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px 8px", borderTop: "1px solid var(--nx-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                        <EmojiPickerButton onEmojiSelect={emoji => setCommentText(p => p + emoji)} />
                        <button type="button"
                          onClick={() => imageInputRef.current?.click()}
                          title="Aggiungi foto"
                          style={{ padding: "4px", color: "var(--nx-text-subtle)", background: "none", border: "none", cursor: "pointer", display: "flex", borderRadius: "50%", transition: "color var(--nx-transition)" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
                          onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-subtle)"}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <button type="submit" disabled={submitting || (!commentText.trim() && !imageFile)}
                        style={{
                          background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff",
                          fontSize: "11px", fontWeight: 600, padding: "4px 14px",
                          borderRadius: "var(--nx-radius-full)", border: "none", cursor: "pointer",
                          opacity: submitting || (!commentText.trim() && !imageFile) ? 0.5 : 1,
                          transition: "opacity var(--nx-transition)",
                        }}>
                        {submitting ? "..." : "Commenta"}
                      </button>
                    </div>
                  )}
                  <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toast.error("Immagine troppo grande (max 5MB)"); return; }
                      setImageFile(file);
                      const reader = new FileReader();
                      reader.onload = () => setImagePreview(reader.result);
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }} />
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default CommentSection;