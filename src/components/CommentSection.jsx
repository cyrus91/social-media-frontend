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
          className="absolute bottom-8 left-0 bg-white rounded-full shadow-2xl border border-gray-100 flex items-center px-3 py-2 space-x-1 z-30"
          style={{ animation: "slideUp 0.15s ease-out" }}
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
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleButtonMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
        className={`flex items-center space-x-1 text-xs font-semibold px-2 py-1 rounded-lg transition hover:bg-gray-100 disabled:opacity-50 ${
          isLiked ? "text-blue-500" : "text-gray-500"
        }`}>
        <span className="text-sm">{myReaction || "👍"}</span>
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
        <div className="bg-gray-100 rounded-2xl px-3 py-2 inline-block max-w-full relative group/comment">
          <Link to={`/profile/${localComment.authorUsername}`}
            className="font-semibold text-gray-800 text-xs hover:underline">
            {localComment.authorUsername}
          </Link>

          {editMode ? (
            <div className="mt-1">
              <textarea value={editText} onChange={e => setEditText(e.target.value)}
                className="w-full text-sm bg-white border border-gray-300 rounded-lg px-2 py-1 outline-none resize-none"
                rows={2} autoFocus />
              <div className="flex space-x-2 mt-1">
                <button onClick={handleEditSave}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition">
                  Salva
                </button>
                <button onClick={() => setEditMode(false)}
                  className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-300 transition">
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 mt-0.5 break-words">{renderTextWithMentions(localComment.content)}</p>
              {/* Immagine allegata al commento */}
              {localComment.imageUrl && (
                <div className="relative inline-block mt-1.5">
                  <img src={localComment.imageUrl} alt="img"
                    className="max-h-48 rounded-xl object-cover cursor-pointer border border-gray-200 hover:opacity-95 transition"
                    onClick={() => window.open(localComment.imageUrl, "_blank")} />
                  {/* Bottone elimina solo immagine — solo autore */}
                  {user?.id === localComment.authorId && (
                    <button type="button"
                      onClick={async () => {
                        const res = await deleteCommentImage(localComment.id);
                        if (res.success) {
                          setLocalComment(prev => ({ ...prev, imageUrl: null }));
                          toast.success("Immagine rimossa");
                        }
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center shadow transition">
                      ✕
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Menu 3 punti — solo autore */}
          {user?.id === localComment.authorId && !editMode && (
            <div className="absolute top-1 right-1 opacity-0 group-hover/comment:opacity-100 transition">
              <div className="relative">
                <button onClick={() => setShowMenu(v => !v)}
                  className="p-1 rounded-full hover:bg-gray-200 transition text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-6 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 w-28">
                    <button onClick={() => { setEditMode(true); setShowMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                      ✏️ Modifica
                    </button>
                    <button onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-gray-50 transition">
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
          <div className="flex flex-wrap gap-1 mt-1 ml-1">
            {Object.entries(localComment.reactions).map(([emoji, count]) => (
              <button key={emoji}
                onClick={() => handleReact(localComment.id, emoji)}
                className={`text-xs rounded-full px-2 py-0.5 border flex items-center space-x-0.5 transition hover:bg-gray-100 ${
                  localComment.myReaction === emoji ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
                }`}>
                <span>{emoji}</span>
                <span className="text-gray-500 font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Azioni sotto commento */}
        <div className="flex items-center space-x-3 mt-1 ml-1">
          <ReactionButton comment={localComment} onReact={handleReact} disabled={!user} />

          {depth === 0 && user && (
            <button onClick={() => setShowReplyForm(v => !v)}
              className="text-xs font-semibold text-gray-500 hover:text-blue-500 transition">
              Rispondi
            </button>
          )}

          <span className="text-xs text-gray-400">{formatDate(localComment.createdAt)}</span>
        </div>

        {/* Form risposta — div invece di form per evitare bubbling al form padre */}
        {showReplyForm && (
          <div className="mt-2 space-y-1">
            {/* Preview immagine reply */}
            {replyImagePreview && (
              <div className="relative inline-block ml-8">
                <img src={replyImagePreview} alt="preview"
                  className="max-h-24 rounded-xl object-cover border border-gray-200" />
                <button type="button"
                  onClick={() => { setReplyImageFile(null); setReplyImagePreview(null); }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                  ✕
                </button>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
                  : <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>}
              </div>
              <div className="flex-1 bg-gray-100 rounded-2xl px-3 py-1.5 space-y-1 relative">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <EmojiPickerButton onEmojiSelect={emoji => setReplyText(p => p + emoji)} />
                    <button type="button"
                      onClick={() => replyImageInputRef.current?.click()}
                      className="p-1 text-gray-400 hover:text-blue-500 transition rounded-full hover:bg-gray-200"
                      title="Aggiungi foto">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <button type="button"
                    onClick={handleSubmitReply}
                    disabled={(!replyText.trim() && !replyImageFile) || submittingReply}
                    className="text-blue-500 hover:text-blue-600 disabled:opacity-40 transition">
                    <svg className="w-4 h-4 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => { setShowReplyForm(false); setReplyImageFile(null); setReplyImagePreview(null); }}
                className="text-gray-400 hover:text-gray-600 text-xs flex-shrink-0">✕</button>
            </div>
            {/* Input foto nascosto per reply */}
            <input ref={replyImageInputRef} type="file" accept="image/*" className="hidden"
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
            <form onSubmit={handleSubmit} className="flex items-start space-x-2 pt-2 border-t border-gray-100">
              <div className="flex-shrink-0">
                {user.avatarUrl
                  ? <img src={user.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                  : <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>}
              </div>
              <div className={`flex-1 relative`}>
                <MentionSuggestions suggestions={mainSuggestions} visible={showMainSuggestions} onSelect={(u) => selectMainMention(u, textareaRef)}  anchorRef={textareaRef} />
                <div className={`border rounded-2xl bg-white transition-all ${commentText ? "border-blue-400" : "border-gray-300"}`}>
                <div className="flex items-center px-3 py-2 space-x-2">
                  {!(commentText || imageFile) && (
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <EmojiPickerButton onEmojiSelect={emoji => setCommentText(p => p + emoji)} />
                      <button type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="p-1 text-gray-400 hover:text-blue-500 transition rounded-full hover:bg-gray-100"
                        title="Aggiungi foto">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                {/* Preview immagine selezionata */}
                {imagePreview && (
                  <div className="px-3 pb-2 relative inline-block">
                    <img src={imagePreview} alt="preview"
                      className="max-h-32 rounded-xl object-cover border border-gray-200" />
                    <button type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                      ✕
                    </button>
                  </div>
                )}
                {(commentText || imageFile) && (
                  <div className="flex items-center justify-between px-2 pb-2 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      <EmojiPickerButton onEmojiSelect={emoji => setCommentText(p => p + emoji)} />
                      {/* Bottone foto */}
                      <button type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="p-1 text-gray-400 hover:text-blue-500 transition rounded-full hover:bg-gray-100"
                        title="Aggiungi foto">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <button type="submit" disabled={submitting || (!commentText.trim() && !imageFile)}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-50">
                      {submitting ? "..." : "Commenta"}
                    </button>
                  </div>
                )}
                {/* Input foto nascosto */}
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
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
                </div>{/* end border box */}
              </div>{/* end relative wrapper */}
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