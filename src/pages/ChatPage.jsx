import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { messagingService } from "../services/messagingService";
import api from "../services/api";
import useAuthStore from "../store/authStore";
import useMessagingStore from "../store/messagingStore";
import {
  setIncomingMessageHandler, clearIncomingMessageHandler,
  notifyMessageSent, playLightSound, sendTypingEvent
} from "../hooks/useMessagingWebSocket";
import AvatarZoom from "../components/AvatarZoom";
import EmojiPickerButton from "../components/EmojiPickerButton";
import toast from "react-hot-toast";

const REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "4px" }}>
      <div style={{
        background: "var(--nx-surface-2)", border: "1px solid var(--nx-border)",
        borderRadius: "4px 16px 16px 16px", padding: "10px 14px",
        display: "flex", alignItems: "center", gap: "4px",
      }}>
        {[0, 150, 300].map(d => (
          <span key={d} style={{ width: "6px", height: "6px", background: "var(--nx-text-subtle)", borderRadius: "50%", animation: "bounce 1s infinite", animationDelay: `${d}ms`, display: "block" }} />
        ))}
      </div>
    </div>
  );
}

function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const conversations = useMessagingStore((state) => state.conversations);
  const markConversationRead = useMessagingStore((state) => state.markConversationRead);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeout = useRef(null);
  const isTypingSent = useRef(false);
  const [replyTo, setReplyTo] = useState(null);
  const [reactionTarget, setReactionTarget] = useState(null);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const longPressTimer = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const [showDisappearing, setShowDisappearing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const deliveredIds = useRef((() => {
    try {
      const stored = localStorage.getItem(`delivered_${conversationId}`);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  })());

  const addDelivered = (id) => {
    if (!deliveredIds.current.has(id)) {
      deliveredIds.current.add(id);
      try { localStorage.setItem(`delivered_${conversationId}`, JSON.stringify([...deliveredIds.current])); }
      catch { /* empty */ }
    }
  };

  const lastSoundMsgId = useRef(null);
  const conversation = conversations.find(c => c.id === parseInt(conversationId));
  const otherOnline = conversation?.otherOnline === true;
  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await messagingService.getMessages(conversationId);
        setMessages(Array.isArray(data) ? data : []);
        markConversationRead(parseInt(conversationId));
      } catch (e) { console.error("Errore caricamento messaggi:", e); }
      finally { setLoading(false); }
    };
    load();
  }, [conversationId]);

  useEffect(() => { scrollToBottom(); }, [messages, otherTyping]);

  useEffect(() => {
    setIncomingMessageHandler((event) => {
      const { type, payload } = event;
      if (type === "NEW_MESSAGE" && parseInt(payload.conversationId) === parseInt(conversationId)) {
        setMessages(prev => [...prev, payload]);
        messagingService.markAsRead(conversationId);
        markConversationRead(parseInt(conversationId));
        setOtherTyping(false);
        if (lastSoundMsgId.current !== payload.id) { lastSoundMsgId.current = payload.id; playLightSound(); }
      }
      if (type === "READ_RECEIPT" && String(payload.conversationId) === String(conversationId))
        setMessages(prev => prev.map(m => m.senderId === currentUser?.id ? { ...m, isRead: true } : m));
      if (type === "TYPING" && String(payload.conversationId) === String(conversationId)) {
        setOtherTyping(payload.isTyping);
        if (payload.isTyping) { clearTimeout(typingTimeout.current); typingTimeout.current = setTimeout(() => setOtherTyping(false), 4000); }
      }
      if (type === "MESSAGE_DELETED" && String(payload.conversationId) === String(conversationId))
        setMessages(prev => prev.map(m => Number(m.id) === Number(payload.messageId) ? { ...m, deletedForAll: true, content: null, imageUrl: null, audioUrl: null } : m));
      if (type === "REACTION")
        setMessages(prev => prev.map(m => Number(m.id) === Number(payload.id) ? payload : m));
    });
    return () => clearIncomingMessageHandler();
  }, [conversationId, currentUser?.id]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!isTypingSent.current) { isTypingSent.current = true; sendTypingEvent(parseInt(conversationId), true); }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => { isTypingSent.current = false; sendTypingEvent(parseInt(conversationId), false); }, 2500);
  };

  const handleSend = async () => {
    if ((!text.trim() && !imageFile) || sending) return;
    setSending(true);
    isTypingSent.current = false;
    sendTypingEvent(parseInt(conversationId), false);
    const currentReply = replyTo;
    setReplyTo(null);
    try {
      let sent;
      if (imageFile) sent = await messagingService.sendMessageWithImage(conversationId, text.trim(), imageFile, currentReply?.id || null);
      else sent = await messagingService.sendMessage(conversationId, text.trim(), currentReply?.id || null);
      setMessages(prev => [...prev, sent]);
      notifyMessageSent(sent);
      setText(""); setImageFile(null); setImagePreview(null);
    } catch { toast.error("Errore nell'invio del messaggio"); setReplyTo(currentReply); }
    finally { setSending(false); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        try { const sent = await messagingService.sendVoiceMessage(conversationId, blob); setMessages(prev => [...prev, sent]); notifyMessageSent(sent); }
        catch { toast.error("Errore invio vocale"); }
      };
      recorder.start(); mediaRecorderRef.current = recorder;
      setRecording(true); setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { toast.error("Microfono non disponibile"); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); clearInterval(recordingIntervalRef.current); setRecording(false); setRecordingTime(0); };
  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") { mediaRecorderRef.current.onstop = null; mediaRecorderRef.current.stop(); mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop()); }
    clearInterval(recordingIntervalRef.current); setRecording(false); setRecordingTime(0);
  };

  const handleDelete = async (messageId) => {
    try {
      await messagingService.deleteMessage(messageId);
      setMessages(prev => prev.map(m => Number(m.id) === Number(messageId) ? { ...m, deletedForAll: true, content: null, imageUrl: null, audioUrl: null } : m));
    } catch { toast.error("Errore eliminazione"); }
    finally { setDeleteTarget(null); }
  };

  const handleReaction = async (messageId, emoji) => {
    setReactionTarget(null);
    const currentMsg = messages.find(m => Number(m.id) === Number(messageId));
    if (!currentMsg) return;
    const normalize = (e) => e?.replace(/\uFE0F/g, "").trim() ?? null;
    const isSame = normalize(currentMsg.myReaction) === normalize(emoji);
    setMessages(prev => prev.map(m => Number(m.id) === Number(messageId) ? { ...m, myReaction: isSame ? null : emoji } : m));
    try {
      const updated = await messagingService.toggleReaction(messageId, emoji);
      setMessages(prev => prev.map(m => Number(m.id) === Number(messageId) ? updated : m));
    } catch {
      setMessages(prev => prev.map(m => Number(m.id) === Number(messageId) ? { ...m, myReaction: currentMsg.myReaction } : m));
      toast.error("Errore reazione");
    }
  };

  const handleDisappearing = async (hours) => {
    setShowDisappearing(false);
    try {
      await messagingService.setDisappearing(conversationId, hours || null);
      toast.success(hours ? `Messaggi eliminati dopo ${hours}h` : "Messaggi che scadono disattivati");
    } catch { toast.error("Errore"); }
  };

  const handleAISummary = async () => {
    setLoadingAI(true);
    try {
      const last20 = messages.slice(-20).filter(m => !m.deletedForAll && m.content).map(m => `${m.senderUsername}: ${m.content}`).join("\n");
      const res = await api.post("/ai/generate", { prompt: `Riassumi brevemente questa conversazione in 2-3 frasi:\n\n${last20}` });
      toast((t) => (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", maxWidth: "300px" }}>
          <span style={{ flex: 1, fontSize: "13px" }}>{res.data?.result || "Nessun riassunto disponibile"}</span>
          <button onClick={() => toast.dismiss(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", fontWeight: 700, fontSize: "14px" }}>✕</button>
        </div>
      ), { duration: Infinity });
    } catch { toast.error("Errore AI"); }
    finally { setLoadingAI(false); }
  };

  const formatTime = (s) => {
    if (!s) return "";
    const iso = String(s).includes("Z") || String(s).includes("+") ? s : s + "Z";
    return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };
  const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const isMyMessage = (msg) => msg.senderId === currentUser?.id;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--nx-bg)" }}>

      {/* HEADER */}
      <div style={{ background: "var(--nx-surface)", borderBottom: "1px solid var(--nx-border)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, boxShadow: "var(--nx-shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => navigate("/messages")}
            style={{ padding: "6px", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", display: "flex", transition: "all var(--nx-transition)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {conversation && (
            <>
              <div style={{ position: "relative" }}>
                <AvatarZoom src={conversation.otherAvatarUrl} username={conversation.otherUsername} size="sm" />
                {otherOnline && <span style={{ position: "absolute", bottom: 0, right: 0, width: "9px", height: "9px", background: "#22c55e", border: "2px solid var(--nx-surface)", borderRadius: "50%" }} />}
              </div>
              <div>
                <button onClick={() => navigate(`/profile/${conversation.otherUsername}`)}
                  style={{ fontWeight: 700, fontSize: "14px", color: "var(--nx-text)", background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color var(--nx-transition)" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#7c3aed"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--nx-text)"}>
                  @{conversation.otherUsername}
                </button>
                <p style={{ fontSize: "11px", color: otherTyping ? "#7c3aed" : otherOnline ? "#22c55e" : "var(--nx-text-subtle)" }}>
                  {otherTyping ? "sta scrivendo..." : otherOnline ? "● Online" : "Offline"}
                </p>
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button onClick={handleAISummary} disabled={loadingAI} title="Riassunto AI"
            style={{ padding: "7px", borderRadius: "var(--nx-radius-sm)", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", display: "flex", transition: "all var(--nx-transition)", opacity: loadingAI ? 0.5 : 1 }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
            {loadingAI
              ? <div style={{ width: "14px", height: "14px", border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              : <span style={{ fontSize: "11px", fontWeight: 800 }}>AI</span>}
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowDisappearing(v => !v)} title="Messaggi che scadono"
              style={{ padding: "7px", borderRadius: "var(--nx-radius-sm)", background: "none", border: "none", cursor: "pointer", color: conversation?.disappearingHours ? "#f97316" : "var(--nx-text-muted)", display: "flex", transition: "background var(--nx-transition)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              ⏱️
            </button>
            {showDisappearing && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", boxShadow: "var(--nx-shadow-lg)", zIndex: 20, width: "160px", overflow: "hidden" }}>
                <p style={{ padding: "8px 14px 6px", fontSize: "11px", fontWeight: 700, color: "var(--nx-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--nx-border)" }}>Messaggi che scadono</p>
                {[{ label: "Disattiva", hours: null }, { label: "1 ora", hours: 1 }, { label: "24 ore", hours: 24 }, { label: "7 giorni", hours: 168 }].map(({ label, hours }) => (
                  <button key={label} onClick={() => handleDisappearing(hours)}
                    style={{ width: "100%", textAlign: "left", padding: "9px 14px", fontSize: "13px", background: "none", border: "none", cursor: "pointer", color: conversation?.disappearingHours === hours ? "#f97316" : "var(--nx-text)", fontWeight: conversation?.disappearingHours === hours ? 700 : 400, transition: "background var(--nx-transition)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MESSAGGI */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}
        onClick={() => { setReactionTarget(null); setActiveMessageId(null); }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <div style={{ width: "24px", height: "24px", border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--nx-text-muted)", fontSize: "13px", padding: "48px 0" }}>Nessun messaggio ancora. Inizia la conversazione!</div>
        ) : (
          <>
            {messages.map((msg) => {
              const mine = isMyMessage(msg);
              const deleted = msg.deletedForAll;
              return (
                <div key={msg.id ?? Math.random()} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }} className="group">
                  <div style={{ maxWidth: "min(320px, 75%)", minWidth: 0 }}
                    onTouchStart={() => { longPressTimer.current = setTimeout(() => setActiveMessageId(msg.id), 400); }}
                    onTouchEnd={() => clearTimeout(longPressTimer.current)}
                    onTouchMove={() => clearTimeout(longPressTimer.current)}
                    onClick={() => { if (activeMessageId === msg.id) setActiveMessageId(null); }}>

                    {/* Reply preview */}
                    {msg.replyToId && !deleted && (
                      <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: "3px" }}>
                        <div style={{ padding: "4px 10px", borderRadius: "var(--nx-radius-sm)", borderLeft: "2px solid #7c3aed", background: "rgba(124,58,237,0.08)", fontSize: "11px", color: "var(--nx-text-muted)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: 700, color: "#7c3aed" }}>@{msg.replyToSenderUsername}</span>
                          <span style={{ marginLeft: "4px" }}>{msg.replyToContent || "Messaggio"}</span>
                        </div>
                      </div>
                    )}

                    {/* Bubble */}
                    <div style={{ position: "relative" }}>
                      {deleted ? (
                        <div style={{ padding: "8px 14px", fontSize: "13px", fontStyle: "italic", color: "var(--nx-text-subtle)", border: "1px dashed var(--nx-border)", borderRadius: mine ? "16px 4px 16px 16px" : "4px 16px 16px 16px" }}>
                          🚫 Messaggio eliminato
                        </div>
                      ) : msg.audioUrl ? (
                        <div style={{ padding: "8px 12px", borderRadius: mine ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: mine ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "var(--nx-surface-2)", border: mine ? "none" : "1px solid var(--nx-border)" }}>
                          <audio controls src={msg.audioUrl} style={{ maxWidth: "200px", height: "32px" }} />
                        </div>
                      ) : msg.imageUrl ? (
                        <img src={msg.imageUrl} alt="Immagine"
                          style={{ borderRadius: mine ? "16px 4px 16px 16px" : "4px 16px 16px 16px", maxWidth: "100%", cursor: "pointer", display: "block" }}
                          onClick={() => window.open(msg.imageUrl, "_blank")} />
                      ) : msg.content ? (
                        <div style={{
                          padding: "9px 14px", fontSize: "13px", lineHeight: 1.45, wordBreak: "break-words",
                          borderRadius: mine ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                          background: mine ? "linear-gradient(135deg,#7c3aed,#0891b2)" : "var(--nx-surface-2)",
                          border: mine ? "none" : "1px solid var(--nx-border)",
                          color: mine ? "#fff" : "var(--nx-text)",
                        }}>
                          {msg.content}
                        </div>
                      ) : null}

                      {/* Azioni hover */}
                      {!deleted && (
                        <div style={{
                          position: "absolute", top: 0,
                          ...(mine ? { left: 0, transform: "translateX(-100%)", paddingRight: "6px" } : { right: 0, transform: "translateX(100%)", paddingLeft: "6px" }),
                          display: activeMessageId === msg.id ? "flex" : "none",
                          alignItems: "center", gap: "2px",
                        }} className={activeMessageId !== msg.id ? "group-hover:flex" : undefined}>
                          <button onClick={(e) => { e.stopPropagation(); setReactionTarget(reactionTarget === msg.id ? null : msg.id); }}
                            style={{ padding: "4px", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "50%", boxShadow: "var(--nx-shadow-sm)", fontSize: "13px", cursor: "pointer", display: "flex" }}>
                            😊
                          </button>
                          <button onClick={() => setReplyTo(msg)}
                            style={{ padding: "5px", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "50%", boxShadow: "var(--nx-shadow-sm)", color: "var(--nx-text-muted)", cursor: "pointer", display: "flex", transition: "all var(--nx-transition)" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "var(--nx-surface)"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                          {mine && (
                            <button onClick={() => setDeleteTarget(msg.id)}
                              style={{ padding: "5px", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "50%", boxShadow: "var(--nx-shadow-sm)", color: "#ef4444", cursor: "pointer", display: "flex", transition: "background var(--nx-transition)" }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                              onMouseLeave={e => e.currentTarget.style.background = "var(--nx-surface)"}>
                              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Reaction picker */}
                      {reactionTarget === msg.id && (
                        <div style={{
                          position: "absolute", ...(mine ? { right: 0 } : { left: 0 }), top: "-48px",
                          background: "var(--nx-surface)", border: "1px solid var(--nx-border)",
                          borderRadius: "var(--nx-radius-full)", boxShadow: "var(--nx-shadow-lg)",
                          display: "flex", alignItems: "center", padding: "5px 10px", gap: "4px", zIndex: 20,
                        }} onClick={e => e.stopPropagation()}>
                          {REACTIONS.map(emoji => (
                            <button key={emoji} onClick={() => handleReaction(msg.id, emoji)}
                              style={{ fontSize: "18px", background: "none", border: "none", cursor: "pointer", transition: "transform 0.1s", opacity: msg.myReaction === emoji ? 0.5 : 1, display: "flex" }}
                              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.3)"}
                              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reaction badges */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", justifyContent: mine ? "flex-end" : "flex-start", marginTop: "3px" }}>
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button key={emoji} onClick={() => handleReaction(msg.id, emoji)}
                            style={{
                              fontSize: "11px", display: "flex", alignItems: "center", gap: "2px",
                              padding: "2px 7px", borderRadius: "var(--nx-radius-full)",
                              background: msg.myReaction === emoji ? "rgba(124,58,237,0.1)" : "var(--nx-surface)",
                              border: `1px solid ${msg.myReaction === emoji ? "rgba(124,58,237,0.4)" : "var(--nx-border)"}`,
                              cursor: "pointer", transition: "all var(--nx-transition)",
                            }}>
                            <span>{emoji}</span>
                            <span style={{ fontWeight: 600, color: "var(--nx-text-muted)" }}>{count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp + spunte */}
                    <p style={{ fontSize: "10px", color: "var(--nx-text-subtle)", marginTop: "2px", textAlign: mine ? "right" : "left", padding: "0 2px" }}>
                      {msg.expiresAt && (() => {
                        const iso = String(msg.expiresAt).includes("Z") || String(msg.expiresAt).includes("+") ? msg.expiresAt : msg.expiresAt + "Z";
                        const diffMs = new Date(iso) - new Date();
                        if (diffMs <= 0) return null;
                        const totalMins = Math.round(diffMs / 60000);
                        const hrs = Math.floor(totalMins / 60); const mins = totalMins % 60;
                        return <span style={{ marginRight: "4px", color: "#f97316" }}>⏱️ {hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`}</span>;
                      })()}
                      {formatTime(msg.createdAt)}
                      {mine && (() => {
                        if (msg.isRead) { addDelivered(msg.id); return <span style={{ marginLeft: "3px", fontWeight: 800, color: "#7c3aed" }}>✓✓</span>; }
                        if (!msg.id) return <span style={{ marginLeft: "3px", color: "var(--nx-text-subtle)" }}>⏳</span>;
                        if (otherOnline) addDelivered(msg.id);
                        if (deliveredIds.current.has(msg.id)) return <span style={{ marginLeft: "3px", fontWeight: 800, color: "var(--nx-text-subtle)" }}>✓✓</span>;
                        return <span style={{ marginLeft: "3px", fontWeight: 800, color: "var(--nx-text-subtle)" }}>✓</span>;
                      })()}
                    </p>
                  </div>
                </div>
              );
            })}
            {otherTyping && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* REPLY PREVIEW */}
      {replyTo && (
        <div style={{ padding: "8px 16px", background: "rgba(124,58,237,0.06)", borderTop: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <div style={{ width: "3px", height: "32px", background: "#7c3aed", borderRadius: "2px", flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed" }}>@{replyTo.senderUsername}</p>
              <p style={{ fontSize: "11px", color: "var(--nx-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {replyTo.audioUrl ? "🎤 Vocale" : replyTo.imageUrl ? "📷 Foto" : replyTo.content}
              </p>
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", marginLeft: "8px", flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* PREVIEW IMMAGINE */}
      {imagePreview && (
        <div style={{ padding: "8px 16px", borderTop: "1px solid var(--nx-border)", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ position: "relative" }}>
            <img src={imagePreview} alt="Preview" style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "var(--nx-radius-sm)", border: "1px solid var(--nx-border)" }} />
            <button onClick={() => { setImageFile(null); setImagePreview(null); }}
              style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", border: "none", cursor: "pointer" }}>✕</button>
          </div>
        </div>
      )}

      {/* INPUT */}
      <div style={{ background: "var(--nx-surface)", borderTop: "1px solid var(--nx-border)", padding: "10px 12px" }}>
        {recording ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--nx-radius-full)", padding: "8px 16px" }}>
              <span style={{ width: "10px", height: "10px", background: "#ef4444", borderRadius: "50%", animation: "pulse 1s infinite", flexShrink: 0 }} />
              <span style={{ color: "#ef4444", fontFamily: "monospace", fontSize: "13px", fontWeight: 600 }}>{formatDuration(recordingTime)}</span>
              <span style={{ color: "#ef4444", fontSize: "11px" }}>Registrazione in corso...</span>
            </div>
            <button onClick={cancelRecording}
              style={{ padding: "8px", color: "var(--nx-text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", borderRadius: "50%", transition: "all var(--nx-transition)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <button onClick={stopRecording}
              style={{ padding: "8px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", transition: "opacity var(--nx-transition)" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <button onClick={() => fileInputRef.current?.click()}
              style={{ padding: "7px", borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", display: "flex", flexShrink: 0, transition: "all var(--nx-transition)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files[0]; if (!f) return;
                setImageFile(f);
                const r = new FileReader(); r.onload = () => setImagePreview(r.result); r.readAsDataURL(f); e.target.value = "";
              }} />

            <div style={{ flex: 1, background: "var(--nx-surface-2)", border: "1.5px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", transition: "border-color var(--nx-transition), box-shadow var(--nx-transition)" }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)"; }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--nx-border)"; e.currentTarget.style.boxShadow = "none"; }}>
              <textarea value={text} onChange={handleTextChange}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Scrivi un messaggio..." rows={1}
                style={{ width: "100%", outline: "none", fontSize: "13px", background: "transparent", padding: "8px 12px 4px", resize: "none", color: "var(--nx-text)", border: "none", display: "block" }}
                onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }} />
              <div style={{ padding: "0 8px 4px" }}>
                <EmojiPickerButton onEmojiSelect={(emoji) => setText(prev => prev + emoji)} />
              </div>
            </div>

            {text.trim() || imageFile ? (
              <button onClick={handleSend} disabled={sending}
                style={{ padding: "9px", background: "linear-gradient(135deg,#7c3aed,#06b6d4)", color: "#fff", border: "none", borderRadius: "50%", cursor: sending ? "not-allowed" : "pointer", display: "flex", flexShrink: 0, opacity: sending ? 0.6 : 1, transition: "opacity var(--nx-transition)" }}>
                {sending
                  ? <div style={{ width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  : <svg width="18" height="18" style={{ transform: "rotate(45deg)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
              </button>
            ) : (
              <button onMouseDown={startRecording} onTouchStart={startRecording}
                title="Tieni premuto per registrare"
                style={{ padding: "9px", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", display: "flex", flexShrink: 0, borderRadius: "50%", transition: "all var(--nx-transition)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL ELIMINA MESSAGGIO */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={() => setDeleteTarget(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-xl)", boxShadow: "var(--nx-shadow-lg)", padding: "28px 24px", maxWidth: "340px", width: "100%", textAlign: "center" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: "48px", height: "48px", background: "rgba(239,68,68,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="22" height="22" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "16px", color: "var(--nx-text)", marginBottom: "8px" }}>Elimina messaggio</h3>
            <p style={{ fontSize: "13px", color: "var(--nx-text-muted)", marginBottom: "20px" }}>Il messaggio verrà eliminato per tutti i partecipanti. Questa azione non può essere annullata.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, background: "var(--nx-surface-2)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius)", cursor: "pointer", color: "var(--nx-text)", transition: "border-color var(--nx-transition)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--nx-border)"}>
                Annulla
              </button>
              <button onClick={() => handleDelete(deleteTarget)}
                style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, background: "#ef4444", border: "none", borderRadius: "var(--nx-radius)", cursor: "pointer", color: "#fff", transition: "opacity var(--nx-transition)" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;