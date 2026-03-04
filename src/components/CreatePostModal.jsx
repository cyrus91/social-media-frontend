import { useState } from "react";
import Modal from "./Modal";
import { createPost } from "../services/postService";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const user = useAuthStore((state) => state.user);

  // State del form
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const MAX_CHARS = 500;

  // Handle image selection with compression
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Valida tipo file
      if (!file.type.startsWith("image/")) {
        setError("Seleziona un file immagine valido");
        return;
      }

      // Valida dimensione (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("L'immagine deve essere massimo 5MB");
        return;
      }

      setImageFile(file);

      // Comprimi e crea preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Comprimi l'immagine
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Dimensioni massime
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;

          let width = img.width;
          let height = img.height;

          // Calcola nuove dimensioni mantenendo aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Disegna immagine compressa
          ctx.drawImage(img, 0, 0, width, height);

          // Converti a base64 con qualità ridotta (0.7 = 70%)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

          setImagePreview(compressedBase64);
        };

        img.src = reader.result;
      };
      reader.readAsDataURL(file);

      setError("");
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validazione
    if (!content.trim()) {
      setError("Scrivi qualcosa prima di pubblicare!");
      return;
    }

    if (content.length > MAX_CHARS) {
      setError(`Massimo ${MAX_CHARS} caratteri`);
      return;
    }

    setLoading(true);

    try {
      // Per ora mandiamo l'immagine come base64
      // In futuro useremo Cloudinary
      const postData = {
        content: content.trim(),
        imageUrl: imagePreview || "",
      };

      const result = await createPost(postData);

      if (result.success) {
        // Success! Chiudi modal e notifica parent
        toast.success("Post pubblicato con successo! 🎉");
        onPostCreated(result.data);
        handleClose();
      } else {
        toast.error(result.error || "Errore nella pubblicazione del post");
        setError(result.error);
      }
    } catch (err) {
      setError("Errore nella creazione del post");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form e chiudi
  const handleClose = () => {
    setContent("");
    setImageFile(null);
    setImagePreview(null);
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crea un nuovo post">
      <form onSubmit={handleSubmit}>
        {/* User info */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.username}</p>
            <p className="text-sm text-gray-500">Pubblico</p>
          </div>
        </div>

        {/* Textarea */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cosa stai pensando?"
            rows="6"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            disabled={loading}
          />

          {/* Character count */}
          <div className="flex justify-end mt-2">
            <span
              className={`text-sm ${
                content.length > MAX_CHARS ? "text-red-500" : "text-gray-500"
              }`}>
              {content.length}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="mb-4 relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full rounded-lg max-h-64 object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          {/* Image upload button */}
          <label className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold cursor-pointer transition">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Foto</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={loading}
            />
          </label>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50">
              Annulla
            </button>

            <button
              type="submit"
              disabled={
                loading || !content.trim() || content.length > MAX_CHARS
              }
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Pubblicazione..." : "Pubblica"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default CreatePostModal;
