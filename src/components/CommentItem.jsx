import { useState, useRef } from "react";
import { useMentionInput } from "../hooks/useMentionInput";
import MentionSuggestions from "./MentionSuggestions";
import MentionTextarea from "./MentionTextarea";
import { renderTextWithMentions } from "../utils/renderTextWithMentions";
import { Link } from "react-router-dom";
import EmojiPickerButton from "./EmojiPickerButton";
import AvatarZoom from "./AvatarZoom";
import {
  createComment,
  deleteComment,
  updateComment,
  deleteCommentImage,
} from "../services/commentService";
import toast from "react-hot-toast";

const REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];
const REACTION_LABELS = { "❤️": "Adoro", "👍": "Mi piace", "😂": "Haha", "😮": "Wow", "😢": "Triste", "🙏": "Grazie" };

// ─── ReactionButton ────────────────────────────────────────────────────────
function ReactionButton({ comment, onReact, disabled }) {
  const [showPicker, setShowPicker] = useState(false);
  const timerRef = useRef(null);
  const userReaction = comment.userReaction;

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setShowPicker(true), 500);
  };
  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setTimeout(() => setShowPicker(false), 200);
  };

  return (
    <div style={{ position: "relative" }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        onClick={() => onReact(comment.id, userReaction ? null : "👍")}
        disabled={disabled}
        aria-label={userReaction ? `Rimuovi reazione ${userReaction}` : "Aggiungi reazione"}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "12px", fontWeight: 600, padding: "3px 6px",
          borderRadius: "var(--nx-radius-sm)", transition: "all var(--nx-transition)",
          color: userReaction ? "#7c3aed" : "var(--nx-text-muted)",
          display: "flex", alignItems: "center", gap: "3px",
        }}
        onMouseEnter={e => { if (!userReaction) { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; } }}
        onMouseLeave={e => { if (!userReaction) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; } }}
      >
        {userReaction || "👍"} {comment.reactionCount > 0 && comment.reactionCount}
      </button>

      {showPicker && (
        <div
          role="group"
          aria-label="Scegli una reazione"
          style={{
            position: "absolute", bottom: "calc(100% + 4px)", left: 0,
            background: "var(--nx-surface)", border: "1px solid var(--nx-border)",
            borderRadius: "var(--nx-radius-full)", padding: "4px 8px",
            display: "flex", gap: "2px", boxShadow: "var(--nx-shadow-lg)", zIndex: 10,
            animation: "slideUp 0.15s ease",
          }}
        >
          {REACTIONS.map(r => (
            <button
              key={r}
              onClick={() => { onReact(comment.id, r === userReaction ? null : r); setShowPicker(false); }}
              aria-label={REACTION_LABELS[r]}
              title={REACTION_LABELS[r]}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "18px", padding: "2px 4px", borderRadius: "50%",
                transition: "transform 0.1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.3)"; e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "none"; }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CommentItem ───────────────────────────────────────────────────────────
function CommentItem({ comment, user, postId, onReact, onReplyCreated, depth = 0, rootId = null, onAddReplyToRoot = null }) {
  const [localComment, setLocalComment] = useState(comment);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [hovered, setHovered] = useState(false);
  const replyRef = useRef(null);
  const editRef = useRef(null);

  const { handleChange: handleReplyChange, selectMention: selectReplyMention, suggestions: replySuggestions, showSuggestions: showReplySuggestions } = useMentionInput(replyText, setReplyText);

  const authorName = localComment.authorUsername || localComment.username || "Utente";
  const isOwn = user?.username === authorName;

  const handleDelete = async () => {
    if (!window.confirm("Eliminare questo commento?")) return;
    const res = await deleteComment(localComment.id);
    if (res.success) {
      setLocalComment(prev => ({ ...prev, deleted: true }));
      toast.success("Commento eliminato");
    } else toast.error("Errore nell'eliminazione");
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setSubmittingEdit(true);
    const res = await updateComment(localComment.id, editText.trim());
    if (res.success) {
      setLocalComment(prev => ({ ...prev, content: editText.trim() }));
      setIsEditing(false);
      toast.success("Commento modificato");
    } else toast.error("Errore nella modifica");
    setSubmittingEdit(false);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    const targetId = rootId || localComment.id;
    const res = await createComment({ postId, content: replyText.trim(), parentId: targetId });
    if (res.success) {
      const newReply = res.data;
      if (depth === 0) {
        setLocalComment(prev => ({ ...prev, replies: [...(prev.replies || []), newReply] }));
      } else {
        onAddReplyToRoot?.(newReply);
      }
      onReplyCreated?.();
      setReplyText("");
      setShowReplyForm(false);
      toast.success("Risposta inviata");
    } else toast.error("Errore nell'invio");
    setSubmittingReply(false);
  };

  const handleDeleteImage = async () => {
    if (!localComment.imageUrl) return;
    const res = await deleteCommentImage(localComment.id);
    if (res.success) setLocalComment(prev => ({ ...prev, imageUrl: null }));
    else toast.error("Errore eliminazione immagine");
  };

  if (localComment.deleted) {
    return (
      <div style={{ padding: "8px 0", color: "var(--nx-text-subtle)", fontSize: "12px", fontStyle: "italic" }}>
        Questo commento è stato eliminato.
      </div>
    );
  }

  const bubbleStyle = {
    background: "var(--nx-surface-2)",
    borderRadius: "var(--nx-radius-lg)",
    padding: "8px 12px",
    border: "1px solid var(--nx-border)",
    position: "relative",
    paddingRight: isOwn && hovered ? "28px" : "12px",
    transition: "padding-right var(--nx-transition)",
  };

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "10px", paddingLeft: depth > 0 ? "24px" : 0 }}>
      <div style={{ flexShrink: 0 }}>
        <Link to={`/profile/${authorName}`} aria-label={`Profilo di ${authorName}`}>
          <AvatarZoom src={localComment.authorAvatarUrl || localComment.avatarUrl} username={authorName} size="sm" />
        </Link>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={bubbleStyle}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Autore */}
          <Link to={`/profile/${authorName}`} style={{ textDecoration: "none" }}>
            <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--nx-text)" }}>{authorName}</span>
          </Link>

          {/* Contenuto */}
          {isEditing ? (
            <div style={{ marginTop: "6px" }}>
              <textarea
                ref={editRef}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                aria-label="Modifica commento"
                style={{ width: "100%", background: "var(--nx-input-bg)", border: "1.5px solid var(--nx-input-border)", borderRadius: "var(--nx-radius)", padding: "6px 10px", fontSize: "13px", color: "var(--nx-text)", outline: "none", resize: "none", minHeight: "60px", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "rgba(124,58,237,0.5)"}
                onBlur={e => e.target.style.borderColor = "var(--nx-input-border)"}
              />
              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                <button onClick={() => setIsEditing(false)}
                  style={{ padding: "4px 12px", borderRadius: "var(--nx-radius-full)", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "var(--nx-text)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  Annulla
                </button>
                <button onClick={handleEdit} disabled={submittingEdit}
                  style={{ padding: "4px 12px", borderRadius: "var(--nx-radius-full)", background: "var(--nx-grad-btn)", border: "none", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                  {submittingEdit ? "..." : "Salva"}
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "var(--nx-text)", marginTop: "2px", lineHeight: 1.5, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
              {renderTextWithMentions(localComment.content)}
            </p>
          )}

          {/* Immagine commento */}
          {localComment.imageUrl && (
            <div style={{ marginTop: "8px", position: "relative", display: "inline-block" }}>
              <img src={localComment.imageUrl} alt="Immagine allegata al commento"
                style={{ maxHeight: "200px", maxWidth: "100%", borderRadius: "var(--nx-radius)", objectFit: "cover", border: "1px solid var(--nx-border)", cursor: "pointer" }} />
              {isOwn && (
                <button onClick={handleDeleteImage} aria-label="Rimuovi immagine"
                  style={{ position: "absolute", top: "4px", right: "4px", width: "20px", height: "20px", background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: "50%", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Menu edit/delete */}
          {isOwn && hovered && !isEditing && (
            <div style={{ position: "absolute", top: "6px", right: "6px", display: "flex", gap: "2px" }}>
              <button onClick={() => setIsEditing(true)} aria-label="Modifica commento"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", padding: "2px 4px", borderRadius: "var(--nx-radius-sm)", fontSize: "11px" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>✏️</button>
              <button onClick={handleDelete} aria-label="Elimina commento"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", padding: "2px 4px", borderRadius: "var(--nx-radius-sm)", fontSize: "11px" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>🗑️</button>
            </div>
          )}
        </div>

        {/* Azioni: reazione + rispondi + timestamp */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", paddingLeft: "4px" }}>
          {user && <ReactionButton comment={localComment} onReact={onReact} />}
          {user && (
            <button onClick={() => setShowReplyForm(s => !s)} aria-label="Rispondi a questo commento"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "var(--nx-text-muted)", padding: "2px 4px", borderRadius: "var(--nx-radius-sm)", transition: "color var(--nx-transition)" }}
              onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text-muted)"}>
              Rispondi
            </button>
          )}
          <span style={{ fontSize: "11px", color: "var(--nx-text-subtle)" }}>
            {localComment.createdAt ? new Date(localComment.createdAt).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
          </span>
        </div>

        {/* Form risposta */}
        {showReplyForm && user && (
          <form onSubmit={handleReply} style={{ display: "flex", gap: "6px", marginTop: "8px", alignItems: "flex-start" }}>
            <div style={{ flexShrink: 0 }}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }} />
                : <div className="nx-avatar-gradient" style={{ width: "26px", height: "26px", fontSize: "10px" }}>{user.username?.charAt(0).toUpperCase()}</div>}
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <MentionSuggestions suggestions={replySuggestions} visible={showReplySuggestions} onSelect={(u) => selectReplyMention(u, replyRef)} anchorRef={replyRef} />
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--nx-input-bg)", border: "1.5px solid var(--nx-input-border)", borderRadius: "var(--nx-radius-full)", padding: "5px 10px" }}>
                <MentionTextarea
                  textareaRef={replyRef}
                  value={replyText}
                  onChange={e => { setReplyText(e.target.value); handleReplyChange(e); }}
                  placeholder={`Rispondi a @${depth > 0 ? authorName : authorName}...`}
                  aria-label={`Rispondi a ${authorName}`}
                  rows={1}
                  className="flex-1"
                />
                {replyText.trim() && (
                  <button type="submit" disabled={submittingReply} aria-label="Invia risposta"
                    style={{ background: "var(--nx-grad-btn)", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff" }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Replies annidate */}
        {localComment.replies?.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            {localComment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                user={user}
                postId={postId}
                onReact={onReact}
                onReplyCreated={onReplyCreated}
                depth={depth + 1}
                rootId={localComment.id}
                onAddReplyToRoot={(newReply) => {
                  setLocalComment(prev => ({ ...prev, replies: [...(prev.replies || []), newReply] }));
                  onReplyCreated?.();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { ReactionButton };
export default CommentItem;