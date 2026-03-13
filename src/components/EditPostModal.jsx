import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import api from "../services/api";

function EditPostModal({ isOpen, onClose, post, onPostUpdated }) {
  //  State iniziali
  const [content, setContent] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);

  // ============================================
  // RESET STATE QUANDO MODAL SI APRE
  // ============================================
  useEffect(() => {
    if (isOpen) {
      //  Inizializza state con i dati del post
      const images = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
      setContent(post.content || "");
      setExistingImages([...images]);
      setImagesToRemove([]);
      setNewImages([]);
      setNewImagePreviews([]);
      setSaving(false);

      console.log("🔄 Modal aperto - State inizializzato:", {
        content: post.content,
        images: images.length,
      });
    }
  }, [isOpen, post.id]);

  // ============================================
  // CLOSE HANDLER CON RESET
  // ============================================
  const handleClose = () => {
    //  Reset state
    setNewImages([]);
    setNewImagePreviews([]);
    setImagesToRemove([]);

    console.log("❌ Modal chiuso - State pulito");
    onClose();
  };

  // ============================================
  // REMOVE EXISTING IMAGE
  // ============================================
  const handleRemoveExistingImage = (index) => {
    if (existingImages.length === 1 && newImages.length === 0) {
      toast.error("Devi lasciare almeno un'immagine o aggiungerne una nuova");
      return;
    }

    const imageUrl = existingImages[index];
    console.log(`🗑️ Rimozione immagine: ${imageUrl}`);

    setImagesToRemove((prev) => [...prev, imageUrl]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================
  // ADD NEW IMAGES (Drag & Drop)
  // ============================================
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024,
    onDrop: (acceptedFiles, rejectedFiles) => {
      const totalImages =
        existingImages.length + newImages.length + acceptedFiles.length;
      if (totalImages > 5) {
        toast.error("Massimo 5 immagini per post");
        return;
      }

      rejectedFiles.forEach((file) => {
        file.errors.forEach((err) => {
          if (err.code === "file-too-large") {
            toast.error(`${file.file.name} supera 5MB`);
          }
        });
      });

      setNewImages((prev) => [...prev, ...acceptedFiles]);

      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setNewImagePreviews((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
    },
  });

  // ============================================
  // REMOVE NEW IMAGE
  // ============================================
  const handleRemoveNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================
  // SAVE CHANGES
  // ============================================
  const handleSave = async () => {
    if (
      !content.trim() &&
      existingImages.length === 0 &&
      newImages.length === 0
    ) {
      toast.error("Il post deve avere contenuto o almeno un'immagine");
      return;
    }

    setSaving(true);

    try {
      // STEP 1: Aggiorna contenuto
      await api.put(`/posts/${post.id}`, {
        content: content.trim(),
      });

      // STEP 2: Rimuovi immagini eliminate
      const originalImages =
        post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);

      for (const imageUrl of imagesToRemove) {
        const originalIndex = originalImages.indexOf(imageUrl);

        if (originalIndex !== -1) {
          console.log(`🗑️ DELETE /posts/${post.id}/images/${originalIndex}`);
          await api.delete(`/posts/${post.id}/images/${originalIndex}`);
        }
      }

      // STEP 3: Aggiungi nuove immagini
      if (newImages.length > 0) {
        console.log(`📤 Upload ${newImages.length} nuove immagini`);
        const formData = new FormData();
        newImages.forEach((image) => {
          formData.append("images", image);
        });

        await api.post(`/posts/${post.id}/images`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      // STEP 4: Fetch post aggiornato
      console.log("🔄 Fetch post aggiornato...");
      const response = await api.get(`/posts/${post.id}`);
      console.log(" Post aggiornato ricevuto:", response.data);

      toast.success("Post modificato con successo!");

      //  Notifica parent con response.data
      if (onPostUpdated) {
        onPostUpdated(response.data);
      }

      handleClose();
    } catch (error) {
      console.error("❌ Errore salvataggio:", error);
      toast.error(
        error.response?.data?.message ||
          "Errore nel salvataggio delle modifiche",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const totalImages = existingImages.length + newImages.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800">Modifica Post</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition">
            <svg
              className="w-6 h-6"
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Textarea */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contenuto
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Modifica il contenuto del post..."
            />
          </div>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Immagini attuali ({existingImages.length})
              </label>
              <div className="grid grid-cols-5 gap-3">
                {existingImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Immagine ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(index)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition shadow-lg opacity-80 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                      <svg
                        className="w-3 h-3"
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
                ))}
              </div>
            </div>
          )}

          {/* New Images */}
          {newImagePreviews.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nuove immagini ({newImagePreviews.length})
              </label>
              <div className="grid grid-cols-5 gap-3">
                {newImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Nuova ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-green-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(index)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition shadow-lg opacity-80 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                      <svg
                        className="w-3 h-3"
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
                    <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      NEW
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Images Dropzone */}
          {totalImages < 5 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Aggiungi immagini ({totalImages}/5)
              </label>
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
                  ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}
                `}>
                <input {...getInputProps()} />
                <svg
                  className="w-10 h-10 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p className="text-sm text-gray-600">
                  {isDragActive
                    ? "Rilascia qui..."
                    : "Trascina immagini o clicca"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-6 py-2.5 text-gray-700 font-semibold hover:bg-gray-200 rounded-lg transition disabled:opacity-50">
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center space-x-2">
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <span>Salva modifiche</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditPostModal;
