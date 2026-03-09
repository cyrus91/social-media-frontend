import { useState } from "react";
import { updateBio, uploadAvatar, deleteAvatar } from "../services/userService";
import toast from "react-hot-toast";

function EditProfileModal({ isOpen, onClose, currentProfile, onProfileUpdated }) {
  const [bio, setBio] = useState(currentProfile?.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentProfile?.avatarUrl || null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validazione tipo file
    if (!file.type.startsWith("image/")) {
      toast.error("Il file deve essere un'immagine!");
      return;
    }

    // Validazione dimensione (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'immagine non può superare 5MB!");
      return;
    }

    setAvatarFile(file);

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm("Sei sicuro di voler rimuovere l'avatar?")) return;

    setLoading(true);

    const result = await deleteAvatar();

    if (result.success) {
      toast.success("Avatar rimosso!");
      setAvatarPreview(null);
      setAvatarFile(null);
      
      // Aggiorna profilo
      if (onProfileUpdated) {
        onProfileUpdated({ ...currentProfile, avatarUrl: null });
      }
    } else {
      toast.error(result.error || "Errore rimozione avatar");
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // 1. Upload avatar se cambiato
      if (avatarFile) {
        const uploadResult = await uploadAvatar(avatarFile);
        if (!uploadResult.success) {
          toast.error(uploadResult.error || "Errore upload avatar");
          setLoading(false);
          return;
        }
        toast.success("Avatar caricato!");
      }

      // 2. Aggiorna bio
      const bioResult = await updateBio(bio);
      if (!bioResult.success) {
        toast.error(bioResult.error || "Errore aggiornamento bio");
        setLoading(false);
        return;
      }

      toast.success("Profilo aggiornato!");

      // Callback per aggiornare profilo nella pagina
      if (onProfileUpdated) {
        onProfileUpdated(bioResult.data);
      }

      onClose();
    } catch (error) {
      console.error("Errore salvataggio profilo:", error);
      toast.error("Errore salvataggio profilo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Modifica Profilo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar Preview */}
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-5xl">
                  {currentProfile?.username?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Remove Avatar Button */}
              {avatarPreview && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={loading}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Upload Avatar Button */}
            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={loading}
              />
              📸 Cambia Avatar
            </label>

            <p className="text-xs text-gray-500">
              Max 5MB • JPG, PNG, GIF
            </p>
          </div>

          {/* Bio Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Raccontaci qualcosa di te..."
              maxLength={500}
              rows={4}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {bio.length}/500 caratteri
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition disabled:opacity-50">
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center space-x-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Salvataggio...</span>
              </>
            ) : (
              <span>💾 Salva</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;