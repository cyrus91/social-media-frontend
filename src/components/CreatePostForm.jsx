import { useState } from "react";
import { createPost } from "../services/postService";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

function CreatePostForm({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentUser = useAuthStore((state) => state.user);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validazione tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Il file deve essere un'immagine!");
      return;
    }

    // Validazione dimensione (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'immagine non può superare 5MB!");
      return;
    }

    setImage(file);

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !image) {
      toast.error("Scrivi qualcosa o aggiungi un'immagine!");
      return;
    }

    setLoading(true);

    const result = await createPost(content, image);

    if (result.success) {
      toast.success("Post pubblicato!");
      setContent("");
      setImage(null);
      setImagePreview(null);

      // Callback per aggiornare feed
      if (onPostCreated) {
        onPostCreated();
      }
    } else {
      toast.error(result.error || "Errore pubblicazione post");
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {currentUser?.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="font-semibold text-gray-800">
            {currentUser?.username}
          </p>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="A cosa stai pensando?"
          rows={3}
          disabled={loading}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 mb-3"
        />

        {/* Image Preview */}
        {imagePreview && (
          <div className="relative mb-3">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full rounded-lg max-h-64 object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition">
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

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <label className="cursor-pointer text-blue-500 hover:text-blue-600 transition flex items-center space-x-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={loading}
            />
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
            <span className="font-semibold">Foto</span>
          </label>

          <button
            type="submit"
            disabled={loading || (!content.trim() && !image)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Pubblicazione...</span>
              </>
            ) : (
              <span>Pubblica</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePostForm;