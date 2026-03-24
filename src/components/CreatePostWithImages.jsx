import { useState, useRef } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import api from "../services/api";
import EmojiPickerButton from "./EmojiPickerButton";
import AIHashtagSuggester from "./AIHashtagSuggester";
import AICaptionGenerator from "./AICaptionGenerator";

function CreatePostWithImages({ onPostCreated }) {
  const currentUser = useAuthStore((state) => state.user);
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const hasContent = content.trim() || images.length > 0;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - images.length;
    const accepted = files.slice(0, remaining);
    accepted.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} supera 5MB`); return; }
      setImages((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onload = () => setPreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
    if (files.length > remaining) toast.error("Massimo 5 immagini per post");
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTextareaChange = (e) => {
    setContent(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      if (!e.target.value) {
        // Reset altezza quando il contenuto è vuoto
        ta.style.height = "auto";
      } else {
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasContent) { toast.error("Scrivi qualcosa o aggiungi un'immagine"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      if (content.trim()) formData.append("content", content.trim());
      images.forEach((img) => formData.append("images", img));
      const response = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Post pubblicato!");
      setContent("");
      setImages([]);
      setPreviews([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      if (onPostCreated) onPostCreated(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Errore nella pubblicazione");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center space-x-3 mb-3">
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt={currentUser.username}
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-500" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {currentUser?.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-800">{currentUser?.username}</p>
            <p className="text-xs text-gray-500">Crea un nuovo post</p>
          </div>
        </div>

        {/* AI Caption */}
        {previews.length > 0 && (
          <div className="mb-3">
            <AICaptionGenerator
              onCaptionGenerated={(caption) => { setContent(caption); toast.success("Caption inserita!"); }}
              imageUrls={previews}
            />
          </div>
        )}

        {/* Box principale — unico sempre montato */}
        <div className={`border rounded-2xl transition-all duration-200 ${hasContent ? 'border-blue-400' : 'border-gray-300'}`}>

          {/* Textarea SEMPRE nel DOM — niente rimount */}
          <div className={`flex items-center px-3 space-x-2 ${hasContent ? 'pt-3 pb-1' : 'py-2'}`}>
            {/* Emoji visibile solo senza contenuto, allineata alla textarea */}
            {!hasContent && (
              <div className="flex-shrink-0" style={{ marginBottom: "4px" }}>
                <EmojiPickerButton
                  onEmojiSelect={(emoji) => {
                    setContent((prev) => prev + emoji);
                    textareaRef.current?.focus();
                  }}
                />
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              placeholder="Cosa stai pensando?"
              rows={hasContent ? 3 : 1}
              style={{ resize: "none" }}
              disabled={uploading}
              className="flex-1 outline-none text-sm bg-transparent py-0.5"
            />
          </div>

          {/* Preview immagini */}
          {previews.length > 0 && (
            <div className="px-3 pb-2">
              <div className="grid grid-cols-5 gap-2">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img src={preview} alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                    <button type="button" onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs shadow">
                      ✕
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barra inferiore — visibile solo con contenuto */}
          {hasContent && (
            <div className="flex items-center justify-between px-2 pb-2 border-t border-gray-100 mt-1">
              <div className="flex items-center space-x-1">
                <EmojiPickerButton
                  onEmojiSelect={(emoji) => {
                    setContent((prev) => prev + emoji);
                    textareaRef.current?.focus();
                  }}
                />
                {images.length < 5 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-gray-400 hover:text-blue-500 transition p-1 rounded-full hover:bg-gray-100"
                    title="Aggiungi immagine">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
                <AIHashtagSuggester
                  content={content}
                  onHashtagsInsert={(tags) => setContent((prev) => prev + tags)}
                />
              </div>
              <button type="submit" disabled={uploading || !hasContent}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-full font-semibold text-sm transition disabled:opacity-50 flex items-center space-x-1">
                {uploading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Pubblicazione...</span>
                  </>
                ) : <span>Pubblica</span>}
              </button>
            </div>
          )}
        </div>

        {/* Bottone foto visibile senza contenuto */}
        {!hasContent && (
          <div className="flex items-center mt-2 px-1">
            <button type="button" onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition text-sm px-2 py-1 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Foto</span>
            </button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" multiple
          className="hidden" onChange={handleFileSelect} disabled={uploading} />
      </form>
    </div>
  );
}

export default CreatePostWithImages;