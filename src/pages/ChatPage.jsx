import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { messagingService } from "../services/messagingService";
import useAuthStore from "../store/authStore";
import useMessagingStore from "../store/messagingStore";
import { useMessagingEvents, notifyMessageSent,
         setIncomingMessageHandler, clearIncomingMessageHandler } from "../hooks/useMessagingWebSocket";
import AvatarZoom from "../components/AvatarZoom";
import EmojiPickerButton from "../components/EmojiPickerButton";
import toast from "react-hot-toast";

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

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Ricava info conversazione dallo store globale
  const conversation = conversations.find(c => c.id === parseInt(conversationId));
  // otherOnline dallo store globale — aggiornato in tempo reale dal WebSocket
  const otherOnline = conversation?.otherOnline === true;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Carica messaggi
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await messagingService.getMessages(conversationId);
        setMessages(Array.isArray(data) ? data : []);
        // Segna come letti nello store locale
        markConversationRead(parseInt(conversationId));
      } catch (e) {
        console.error("Errore caricamento messaggi:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [conversationId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Ascolta read receipts dal WebSocket singleton
  const handleEvent = useCallback((type, payload) => {
    if (type === "READ_RECEIPT") {
      // conversationId da useParams è stringa, payload.conversationId è numero
      if (String(payload.conversationId) === String(conversationId)) {
        setMessages((prev) =>
          prev.map((m) => m.senderId === currentUser?.id ? { ...m, isRead: true } : m)
        );
      }
    }
  }, [conversationId, currentUser?.id]);

  useMessagingEvents(handleEvent);

  // Registra handler per messaggi in arrivo mentre la chat è aperta
  useEffect(() => {
    setIncomingMessageHandler((msg) => {
      if (parseInt(msg.conversationId) === parseInt(conversationId)) {
        setMessages((prev) => [...prev, msg]);
        messagingService.markAsRead(conversationId);
        markConversationRead(parseInt(conversationId));
      }
    });
    return () => clearIncomingMessageHandler();
  }, [conversationId]);

  const handleSend = async () => {
    if ((!text.trim() && !imageFile) || sending) return;
    setSending(true);
    try {
      let sent;
      if (imageFile) {
        sent = await messagingService.sendMessageWithImage(conversationId, text.trim(), imageFile);
      } else {
        sent = await messagingService.sendMessage(conversationId, text.trim());
      }
      setMessages((prev) => [...prev, sent]);
      // Aggiorna lo store globale (per MessagesPage del mittente)
      notifyMessageSent(sent);
      setText("");
      setImageFile(null);
      setImagePreview(null);
    } catch {
      toast.error("Errore nell'invio del messaggio");
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  const isMyMessage = (msg) => msg.senderId === currentUser?.id;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center space-x-3 sticky top-0 z-10">
        <button onClick={() => navigate("/messages")}
          className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100">
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
              <p className={`text-xs ${otherOnline ? "text-green-500" : "text-gray-400"}`}>{otherOnline ? "● Online" : "Offline"}</p>
            </div>
          </>
        )}
      </div>

      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">Nessun messaggio ancora. Inizia la conversazione!</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id ?? Math.random()} className={`flex ${isMyMessage(msg) ? "justify-end" : "justify-start"}`}>
              <div className="max-w-xs sm:max-w-sm lg:max-w-md space-y-1">
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Immagine"
                    className={`rounded-2xl max-w-full cursor-pointer ${isMyMessage(msg) ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                    onClick={() => window.open(msg.imageUrl, "_blank")} />
                )}
                {msg.content && (
                  <div className={`px-4 py-2 rounded-2xl text-sm ${
                    isMyMessage(msg) ? "bg-blue-500 text-white rounded-tr-sm" : "bg-white text-gray-800 shadow-sm rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                )}
                {/* Timestamp + spunte */}
                <p className={`text-xs px-1 text-gray-400 ${isMyMessage(msg) ? "text-right" : "text-left"}`}>
                  {formatTime(msg.createdAt)}
                  {isMyMessage(msg) && (() => {
                    if (msg.isRead) {
                      // Letto → ✓✓ blu
                      return <span className="ml-1 font-bold text-blue-500">✓✓</span>;
                    }
                    if (!msg.id) {
                      // In invio (ottimistico, non ancora salvato) → ⏳
                      return <span className="ml-1 text-gray-400">⏳</span>;
                    }
                    if (otherOnline) {
                      // Salvato + destinatario online ma non letto → ✓✓ grigia
                      return <span className="ml-1 font-bold text-gray-400">✓✓</span>;
                    }
                    // Salvato + destinatario offline → ✓ grigia
                    return <span className="ml-1 font-bold text-gray-400">✓</span>;
                  })()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preview immagine */}
      {imagePreview && (
        <div className="px-4 pb-2 flex items-center space-x-2">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
            <button onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
          </div>
          <span className="text-xs text-gray-500">Immagine allegata</span>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end space-x-2">
          <button onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-blue-500 transition p-2 rounded-full hover:bg-gray-100 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

          <div className="flex-1 border border-gray-300 rounded-2xl focus-within:border-blue-400 transition bg-white">
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Scrivi un messaggio..." rows={1} style={{ resize: "none" }}
              className="w-full outline-none text-sm bg-transparent px-4 pt-2 pb-1"
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }} />
            <div className="px-2 pb-2">
              <EmojiPickerButton onEmojiSelect={(emoji) => setText((prev) => prev + emoji)} />
            </div>
          </div>

          <button onClick={handleSend} disabled={sending || (!text.trim() && !imageFile)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition disabled:opacity-50 flex-shrink-0">
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;