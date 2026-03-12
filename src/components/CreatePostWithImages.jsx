import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { createPostWithImages } from "../services/postService";
import toast from "react-hot-toast";

function CreatePostWithImages({ onPostCreated, onCancel }) {
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
    onDrop: (acceptedFiles) => {
      if (images.length + acceptedFiles.length > 5) {
        toast.error("Massimo 5 immagini per post");
        return;
      }

      // Aggiungi file
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
  };

  // ============================================
  // REORDER IMAGES (Drag within preview)
  // ============================================
/*   const moveImage = (fromIndex, toIndex) => {
    const newImages = [...images];
    const newPreviews = [...previews];

    const [movedImage] = newImages.splice(fromIndex, 1);
    const [movedPreview] = newPreviews.splice(fromIndex, 1);

    newImages.splice(toIndex, 0, movedImage);
    newPreviews.splice(toIndex, 0, movedPreview);

    setImages(newImages);
    setPreviews(newPreviews);
  }; */

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
      const result = await createPostWithImages(content.trim(), images);

      if (result.success) {
        toast.success("Post pubblicato con successo!");
        setContent("");
        setImages([]);
        setPreviews([]);
        if (onPostCreated) onPostCreated(result.data);
      } else {
        toast.error(result.error || "Errore nella pubblicazione");
      }
    } catch (error) {
      console.error("❌ Errore pubblicazione:", error);
      toast.error("Errore imprevisto");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Crea Post</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Cosa stai pensando?"
          rows="4"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
        />

        {/* Drag & Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}
          `}>
          <input {...getInputProps()} />
          
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
                Massimo 5 immagini (5MB ciascuna)
              </p>
            </div>
          )}
        </div>

        {/* Image Previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-5 gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                />

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Order Badge */}
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded-full">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-semibold transition">
              Annulla
            </button>
          )}

          <button
            type="submit"
            disabled={uploading || (!content.trim() && images.length === 0)}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? "Pubblicazione..." : "Pubblica"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePostWithImages;