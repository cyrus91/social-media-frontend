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
    <div className="flex justify-start">
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center space-x-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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

  // Typing indicator
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeout = useRef(null);
  const isTypingSent = useRef(false);

  // Reply
  const [replyTo, setReplyTo] = useState(null);

  // Reactions popup
  const [reactionTarget, setReactionTarget] = useState(null);

  // Mobile: mostra azioni al tap (invece di hover)
  const [activeMessageId, setActiveMessageId] = useState(null);
  const longPressTimer = useRef(null); // messageId

  // Voice recording
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  // Disappearing messages
  const [showDisappearing, setShowDisappearing] = useState(false);

  // AI summary
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
      catch { }
    }
  };
  const lastSoundMsgId = useRef(null);

  const conversation = conversations.find(c => c.id === parseInt(conversationId));
  const otherOnline = conversation?.otherOnline === true;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Carica messaggi
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await messagingService.getMessages(conversationId);
        setMessages(Array.isArray(data) ? data : []);
        markConversationRead(parseInt(conversationId));
      } catch (e) {
        console.error("Errore caricamento messaggi:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [conversationId]);

  useEffect(() => { scrollToBottom(); }, [messages, otherTyping]);

  // Handler centralizzato per tutti gli eventi WebSocket
  useEffect(() => {
    setIncomingMessageHandler((event) => {
      const { type, payload } = event;

      if (type === "NEW_MESSAGE") {
        if (parseInt(payload.conversationId) === parseInt(conversationId)) {
          setMessages(prev => [...prev, payload]);
          messagingService.markAsRead(conversationId);
          markConversationRead(parseInt(conversationId));
          setOtherTyping(false);
          if (lastSoundMsgId.current !== payload.id) {
            lastSoundMsgId.current = payload.id;
            playLightSound();
          }
        }
      }

      if (type === "READ_RECEIPT") {
        if (String(payload.conversationId) === String(conversationId)) {
          setMessages(prev => prev.map(m =>
            m.senderId === currentUser?.id ? { ...m, isRead: true } : m
          ));
        }
      }

      if (type === "TYPING") {
        if (String(payload.conversationId) === String(conversationId)) {
          setOtherTyping(payload.isTyping);
          if (payload.isTyping) {
            clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => setOtherTyping(false), 4000);
          }
        }
      }

      if (type === "MESSAGE_DELETED") {
        if (String(payload.conversationId) === String(conversationId)) {
          setMessages(prev => prev.map(m =>
            Number(m.id) === Number(payload.messageId)
              ? { ...m, deletedForAll: true, content: null, imageUrl: null, audioUrl: null }
              : m
          ));
        }
      }

      if (type === "REACTION") {
        // Usa Number() per evitare mismatch stringa/numero tra JS e Java Long
        setMessages(prev => prev.map(m =>
          Number(m.id) === Number(payload.id) ? payload : m
        ));
      }
    });
    return () => clearIncomingMessageHandler();
  }, [conversationId, currentUser?.id]);

  // Invia evento typing
  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!isTypingSent.current) {
      isTypingSent.current = true;
      sendTypingEvent(parseInt(conversationId), true);
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTypingSent.current = false;
      sendTypingEvent(parseInt(conversationId), false);
    }, 2500);
  };

  const handleSend = async () => {
    if ((!text.trim() && !imageFile) || sending) return;
    setSending(true);
    // Ferma typing
    isTypingSent.current = false;
    sendTypingEvent(parseInt(conversationId), false);
    const currentReply = replyTo;
    setReplyTo(null);
    try {
      let sent;
      if (imageFile) {
        sent = await messagingService.sendMessageWithImage(
          conversationId, text.trim(), imageFile, currentReply?.id || null);
      } else {
        sent = await messagingService.sendMessage(
          conversationId, text.trim(), currentReply?.id || null);
      }
      setMessages(prev => [...prev, sent]);
      notifyMessageSent(sent);
      setText("");
      setImageFile(null);
      setImagePreview(null);
    } catch {
      toast.error("Errore nell'invio del messaggio");
      setReplyTo(currentReply);
    } finally {
      setSending(false);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        try {
          const sent = await messagingService.sendVoiceMessage(conversationId, blob);
          setMessages(prev => [...prev, sent]);
          notifyMessageSent(sent);
        } catch { toast.error("Errore invio vocale"); }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { toast.error("Microfono non disponibile"); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(recordingIntervalRef.current);
    setRecording(false);
    setRecordingTime(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    clearInterval(recordingIntervalRef.current);
    setRecording(false);
    setRecordingTime(0);
  };

  // Delete
  const handleDelete = async (messageId) => {
    if (!window.confirm("Eliminare questo messaggio per tutti?")) return;
    try {
      await messagingService.deleteMessage(messageId);
      setMessages(prev => prev.map(m =>
        Number(m.id) === Number(messageId)
          ? { ...m, deletedForAll: true, content: null, imageUrl: null, audioUrl: null }
          : m
      ));
    } catch { toast.error("Errore eliminazione"); }
  };

  // Reaction — optimistic update solo su myReaction (istantaneo)
  // I contatori reali arrivano dal server, evitando race conditions e problemi Unicode
  const handleReaction = async (messageId, emoji) => {
    setReactionTarget(null);

    const currentMsg = messages.find(m => Number(m.id) === Number(messageId));
    if (!currentMsg) return;

    // Normalizza emoji per evitare problemi Unicode (es. ❤ vs ❤️)
    const normalize = (e) => e?.replace(/\uFE0F/g, "").trim() ?? null;
    const isSame = normalize(currentMsg.myReaction) === normalize(emoji);

    // Optimistic: aggiorna solo myReaction subito (istantaneo)
    setMessages(prev => prev.map(m =>
      Number(m.id) === Number(messageId)
        ? { ...m, myReaction: isSame ? null : emoji }
        : m
    ));

    try {
      const updated = await messagingService.toggleReaction(messageId, emoji);
      // Sincronizza tutto (contatori inclusi) con il dato reale del server
      setMessages(prev => prev.map(m =>
        Number(m.id) === Number(messageId) ? updated : m
      ));
    } catch {
      // Rollback in caso di errore
      setMessages(prev => prev.map(m =>
        Number(m.id) === Number(messageId)
          ? { ...m, myReaction: currentMsg.myReaction }
          : m
      ));
      toast.error("Errore reazione");
    }
  };

  // Disappearing
  const handleDisappearing = async (hours) => {
    setShowDisappearing(false);
    try {
      await messagingService.setDisappearing(conversationId, hours || null);
      toast.success(hours
        ? `Messaggi eliminati dopo ${hours}h`
        : "Messaggi che scadono disattivati");
    } catch { toast.error("Errore"); }
  };

  // AI Summary
  const handleAISummary = async () => {
    setLoadingAI(true);
    try {
      const last20 = messages.slice(-20)
        .filter(m => !m.deletedForAll && m.content)
        .map(m => `${m.senderUsername}: ${m.content}`)
        .join("\n");
      const res = await api.post("/ai/generate", {
        prompt: `Riassumi brevemente questa conversazione in 2-3 frasi:\n\n${last20}`
      });
      // Toast con X manuale — non sparisce automaticamente (duration: Infinity)
      toast(
        (t) => (
          <div className="flex items-start space-x-3 max-w-sm">
            <span className="flex-1 text-sm">{res.data?.result || "Nessun riassunto disponibile"}</span>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 font-bold text-base leading-none ml-1">
              ✕
            </button>
          </div>
        ),
        { duration: Infinity }
      );
    } catch { toast.error("Errore AI"); } finally { setLoadingAI(false); }
  };

  const formatTime = (s) => {
    if (!s) return "";
    // Se il timestamp non ha 'Z' o offset, aggiunge 'Z' per indicare UTC
    const iso = String(s).includes("Z") || String(s).includes("+") ? s : s + "Z";
    return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };
  const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const isMyMessage = (msg) => msg.senderId === currentUser?.id;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate("/messages")}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {conversation && (
            <>
              <div className="relative">
                <AvatarZoom src={conversation.otherAvatarUrl} username={conversation.otherUsername} size="sm" />
                {otherOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />}
              </div>
              <div>
                <button onClick={() => navigate(`/profile/${conversation.otherUsername}`)}
                  className="font-semibold text-gray-800 text-sm hover:text-blue-500 transition">
                  @{conversation.otherUsername}
                </button>
                <p className={`text-xs ${otherTyping ? "text-blue-500" : otherOnline ? "text-green-500" : "text-gray-400"}`}>
                  {otherTyping ? "sta scrivendo..." : otherOnline ? "● Online" : "Offline"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Azioni header */}
        <div className="flex items-center space-x-1">
          {/* AI Summary */}
          <button onClick={handleAISummary} disabled={loadingAI}
            title="Riassunto AI"
            className="p-2 text-gray-400 hover:text-purple-500 hover:bg-gray-100 rounded-full transition disabled:opacity-50">
            {loadingAI
              ? <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              : <span className="text-sm font-bold">AI</span>}
          </button>

          {/* Disappearing messages */}
          <div className="relative">
            <button onClick={() => setShowDisappearing(v => !v)}
              title="Messaggi che scadono"
              className={`p-2 rounded-full hover:bg-gray-100 transition ${conversation?.disappearingHours ? "text-orange-500" : "text-gray-400 hover:text-orange-500"}`}>
              ⏱️
            </button>
            {showDisappearing && (
              <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-100 z-20 w-44 overflow-hidden">
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 border-b">Messaggi che scadono</p>
                {[
                  { label: "Disattiva", hours: null },
                  { label: "1 ora", hours: 1 },
                  { label: "24 ore", hours: 24 },
                  { label: "7 giorni", hours: 168 },
                ].map(({ label, hours }) => (
                  <button key={label} onClick={() => handleDisappearing(hours)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${
                      conversation?.disappearingHours === hours ? "text-orange-500 font-semibold" : "text-gray-700"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MESSAGGI */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        onClick={() => { setReactionTarget(null); setActiveMessageId(null); }}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">Nessun messaggio ancora. Inizia la conversazione!</div>
        ) : (
          <>
            {messages.map((msg) => {
              const mine = isMyMessage(msg);
              const deleted = msg.deletedForAll;
              return (
                <div key={msg.id ?? Math.random()} className={`flex ${mine ? "justify-end" : "justify-start"} group`}>
                  <div className="max-w-xs sm:max-w-sm lg:max-w-md space-y-0.5 min-w-0"
                    onTouchStart={() => {
                      longPressTimer.current = setTimeout(() => {
                        setActiveMessageId(msg.id);
                      }, 400);
                    }}
                    onTouchEnd={() => clearTimeout(longPressTimer.current)}
                    onTouchMove={() => clearTimeout(longPressTimer.current)}
                    onClick={() => {
                      if (activeMessageId === msg.id) setActiveMessageId(null);
                    }}
                  >

                    {/* Reply preview */}
                    {msg.replyToId && !deleted && (
                      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`px-3 py-1.5 rounded-xl text-xs border-l-2 border-blue-400 bg-gray-100 text-gray-500 max-w-full truncate`}>
                          <span className="font-semibold text-blue-500">@{msg.replyToSenderUsername}</span>
                          <span className="ml-1">{msg.replyToContent || "Messaggio"}</span>
                        </div>
                      </div>
                    )}

                    {/* Bubble */}
                    <div className="relative">
                      {deleted ? (
                        <div className={`px-4 py-2 rounded-2xl text-sm italic text-gray-400 border border-dashed border-gray-300 ${mine ? "rounded-tr-sm" : "rounded-tl-sm"}`}>
                          🚫 Messaggio eliminato
                        </div>
                      ) : msg.audioUrl ? (
                        <div className={`px-3 py-2 rounded-2xl ${mine ? "bg-blue-500 rounded-tr-sm" : "bg-white shadow-sm rounded-tl-sm"}`}>
                          <audio controls src={msg.audioUrl} className="max-w-[200px] h-8" />
                        </div>
                      ) : msg.imageUrl ? (
                        <img src={msg.imageUrl} alt="Immagine"
                          className={`rounded-2xl max-w-full cursor-pointer ${mine ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                          onClick={() => window.open(msg.imageUrl, "_blank")} />
                      ) : msg.content ? (
                        <div className={`px-4 py-2 rounded-2xl text-sm break-words ${mine ? "bg-blue-500 text-white rounded-tr-sm" : "bg-white text-gray-800 shadow-sm rounded-tl-sm"}`}>
                          {msg.content}
                        </div>
                      ) : null}

                      {/* Azioni su hover/tap — reply, react, delete */}
                      {!deleted && (
                        <div className={`absolute top-0 ${mine ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"} 
                          ${activeMessageId === msg.id ? "flex" : "hidden group-hover:flex"} items-center space-x-1`}>
                          {/* Reazione */}
                          <button onClick={(e) => { e.stopPropagation(); setReactionTarget(reactionTarget === msg.id ? null : msg.id); }}
                            className="p-1 bg-white rounded-full shadow text-sm hover:bg-gray-100 transition">
                            😊
                          </button>
                          {/* Reply */}
                          <button onClick={() => setReplyTo(msg)}
                            className="p-1 bg-white rounded-full shadow text-gray-500 hover:bg-gray-100 transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                          {/* Delete (solo miei) */}
                          {mine && (
                            <button onClick={() => handleDelete(msg.id)}
                              className="p-1 bg-white rounded-full shadow text-red-400 hover:bg-red-50 transition">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Picker reazioni */}
                      {reactionTarget === msg.id && (
                        <div className={`absolute ${mine ? "right-0" : "left-0"} -top-10 bg-white rounded-full shadow-xl border border-gray-100 flex items-center px-2 py-1 space-x-1 z-20`}
                          onClick={e => e.stopPropagation()}>
                          {REACTIONS.map(emoji => (
                            <button key={emoji} onClick={() => handleReaction(msg.id, emoji)}
                              className={`text-lg hover:scale-125 transition-transform ${msg.myReaction === emoji ? "opacity-50" : ""}`}>
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reazioni esistenti */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`flex flex-wrap gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button key={emoji} onClick={() => handleReaction(msg.id, emoji)}
                            className={`text-xs bg-white border rounded-full px-2 py-0.5 shadow-sm flex items-center space-x-0.5 hover:bg-gray-50 transition ${msg.myReaction === emoji ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}>
                            <span>{emoji}</span>
                            <span className="text-gray-500 font-medium">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp + spunte */}
                    <p className={`text-xs px-1 text-gray-400 ${mine ? "text-right" : "text-left"}`}>
                      {msg.expiresAt && (() => {
                          const iso = String(msg.expiresAt).includes("Z") || String(msg.expiresAt).includes("+")
                            ? msg.expiresAt : msg.expiresAt + "Z";
                          const diffMs = new Date(iso) - new Date();
                          if (diffMs <= 0) return null;
                          const totalMins = Math.round(diffMs / 60000);
                          const hrs = Math.floor(totalMins / 60);
                          const mins = totalMins % 60;
                          const label = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                          return <span className="mr-1 text-orange-400">⏱️ {label}</span>;
                        })()}
                      {formatTime(msg.createdAt)}
                      {mine && (() => {
                        if (msg.isRead) { addDelivered(msg.id); return <span className="ml-1 font-bold text-blue-500">✓✓</span>; }
                        if (!msg.id) return <span className="ml-1 text-gray-400">⏳</span>;
                        if (otherOnline) addDelivered(msg.id);
                        if (deliveredIds.current.has(msg.id))
                          return <span className="ml-1 font-bold text-gray-400">✓✓</span>;
                        return <span className="ml-1 font-bold text-gray-400">✓</span>;
                      })()}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {otherTyping && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* REPLY PREVIEW */}
      {replyTo && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-0.5 h-8 bg-blue-400 rounded-full flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-500">@{replyTo.senderUsername}</p>
              <p className="text-xs text-gray-500 truncate">
                {replyTo.audioUrl ? "🎤 Vocale" : replyTo.imageUrl ? "📷 Foto" : replyTo.content}
              </p>
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">✕</button>
        </div>
      )}

      {/* PREVIEW IMMAGINE */}
      {imagePreview && (
        <div className="px-4 pb-2 flex items-center space-x-2 border-t border-gray-100">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
            <button onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
          </div>
        </div>
      )}

      {/* INPUT */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        {recording ? (
          /* RECORDING UI */
          <div className="flex items-center space-x-3">
            <div className="flex-1 flex items-center space-x-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
              <span className="text-red-600 font-mono text-sm">{formatDuration(recordingTime)}</span>
              <span className="text-red-400 text-xs">Registrazione in corso...</span>
            </div>
            <button onClick={cancelRecording}
              className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button onClick={stopRecording}
              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-end space-x-2">
            {/* Foto */}
            <button onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-blue-500 p-2 rounded-full hover:bg-gray-100 transition flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files[0]; if (!f) return;
                setImageFile(f);
                const r = new FileReader();
                r.onload = () => setImagePreview(r.result);
                r.readAsDataURL(f);
                e.target.value = "";
              }} />

            {/* Textarea */}
            <div className="flex-1 border border-gray-300 rounded-2xl focus-within:border-blue-400 transition bg-white">
              <textarea value={text} onChange={handleTextChange}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Scrivi un messaggio..." rows={1} style={{ resize: "none" }}
                className="w-full outline-none text-sm bg-transparent px-4 pt-2 pb-1"
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                }} />
              <div className="px-2 pb-1">
                <EmojiPickerButton onEmojiSelect={(emoji) => setText(prev => prev + emoji)} />
              </div>
            </div>

            {/* Invio o vocale */}
            {text.trim() || imageFile ? (
              <button onClick={handleSend} disabled={sending}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition disabled:opacity-50 flex-shrink-0">
                {sending
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <svg className="w-5 h-5 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>}
              </button>
            ) : (
              <button onMouseDown={startRecording} onTouchStart={startRecording}
                className="text-gray-400 hover:text-blue-500 p-2 rounded-full hover:bg-gray-100 transition flex-shrink-0"
                title="Tieni premuto per registrare">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPage;