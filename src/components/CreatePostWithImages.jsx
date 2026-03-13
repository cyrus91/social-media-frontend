import { useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import api from "../services/api";

function CreatePostWithImages({ onPostCreated }) {
  const currentUser = useAuthStore((state) => state.user);
  
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // ============================================
  // DRAG & DROP CONFIG
  // ============================================
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB per file
    onDrop: (acceptedFiles, rejectedFiles) => {
      // Gestione file rifiutati
      rejectedFiles.forEach((file) => {
        file.errors.forEach((err) => {
          if (err.code === "file-too-large") {
            toast.error(`${file.file.name} supera 5MB`);
          } else if (err.code === "file-invalid-type") {
            toast.error(`${file.file.name} non è un'immagine valida`);
          } else if (err.code === "too-many-files") {
            toast.error("Massimo 5 immagini per post");
          }
        });
      });

      // Controllo limite
      if (images.length + acceptedFiles.length > 5) {
        toast.error("Massimo 5 immagini per post");
        return;
      }

      // Aggiungi file accettati
      setImages((prev) => [...prev, ...acceptedFiles]);

      // Genera preview
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviews((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    },
  });

  // ============================================
  // REMOVE IMAGE
  // ============================================
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    toast.success("Immagine rimossa");
  };

  // ============================================
  // SUBMIT
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validazione
    if (!content.trim() && images.length === 0) {
      toast.error("Scrivi qualcosa o aggiungi almeno un'immagine");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      if (content.trim()) {
        formData.append("content", content.trim());
      }

      // Aggiungi tutte le immagini
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Post pubblicato con successo!");
      
      // Reset form
      setContent("");
      setImages([]);
      setPreviews([]);

      if (onPostCreated) {
        onPostCreated(response.data);
      }
    } catch (error) {
      console.error("❌ Errore pubblicazione:", error);
      toast.error(error.response?.data?.message || "Errore nella pubblicazione del post");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.username}
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
            />
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

        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Cosa stai pensando?"
          rows="4"
          disabled={uploading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none disabled:opacity-50 transition"
        />

        {/* Drag & Drop Zone */}
        {images.length < 5 && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragActive ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}
              ${uploading ? "opacity-50 cursor-not-allowed" : ""}
            `}>
            <input {...getInputProps()} disabled={uploading} />
            
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>

            {isDragActive ? (
              <p className="text-blue-600 font-semibold">Rilascia le immagini qui...</p>
            ) : (
              <div>
                <p className="text-gray-600 font-semibold mb-1">
                  Trascina immagini qui o clicca per selezionare
                </p>
                <p className="text-sm text-gray-400">
                  Massimo 5 immagini • 5MB ciascuna • PNG, JPG, WEBP, GIF
                </p>
              </div>
            )}
          </div>
        )}

        {/* Image Previews */}
        {previews.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                {previews.length} {previews.length === 1 ? "immagine" : "immagini"} selezionate
              </p>
              {previews.length < 5 && (
                <p className="text-xs text-gray-500">
                  Puoi aggiungerne ancora {5 - previews.length}
                </p>
              )}
            </div>

            <div className="grid grid-cols-5 gap-3">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition"
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={uploading}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition disabled:opacity-50 shadow-lg">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Order Badge */}
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={uploading || (!content.trim() && images.length === 0)}
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Pubblicazione...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Pubblica</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePostWithImages;