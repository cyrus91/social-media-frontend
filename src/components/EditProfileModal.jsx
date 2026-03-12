import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateBio, uploadAvatar, deleteAvatar, deleteAccount } from "../services/userService";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

function EditProfileModal({ isOpen, onClose, currentProfile, onProfileUpdated }) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  // ============================================
  // STATE
  // ============================================
  const [bio, setBio] = useState(currentProfile?.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentProfile?.avatarUrl || null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // ============================================
  // SE MODAL NON APERTO, NON RENDERIZZARE
  // ============================================
  if (!isOpen) return null;

  // ============================================
  // HANDLE CAMBIO AVATAR
  // ============================================
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

    // Crea preview locale
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ============================================
  // HANDLE RIMOZIONE AVATAR
  // ============================================
  const handleRemoveAvatar = async () => {
    if (!window.confirm("Sei sicuro di voler rimuovere l'avatar?")) return;

    setLoading(true);

    const result = await deleteAvatar();

    if (result.success) {
      toast.success("Avatar rimosso!");
      setAvatarPreview(null);
      setAvatarFile(null);

      // Aggiorna profilo nel parent
      if (onProfileUpdated) {
        onProfileUpdated({ ...currentProfile, avatarUrl: null });
      }
    } else {
      toast.error(result.error || "Errore rimozione avatar");
    }

    setLoading(false);
  };

  // ============================================
  // HANDLE SALVA MODIFICHE PROFILO
  // ============================================
  const handleSave = async () => {
    setLoading(true);

    try {
      // STEP 1: Upload avatar se è stato selezionato un nuovo file
      if (avatarFile) {
        const uploadResult = await uploadAvatar(avatarFile);
        if (!uploadResult.success) {
          toast.error(uploadResult.error || "Errore upload avatar");
          setLoading(false);
          return;
        }
        toast.success("Avatar caricato!");
      }

      // STEP 2: Aggiorna bio
      const bioResult = await updateBio(bio);
      if (!bioResult.success) {
        toast.error(bioResult.error || "Errore aggiornamento bio");
        setLoading(false);
        return;
      }

      toast.success("Profilo aggiornato!");

      // STEP 3: Notifica il parent component per aggiornare la UI
      if (onProfileUpdated) {
        onProfileUpdated(bioResult.data);
      }

      // STEP 4: Chiudi modal
      onClose();
    } catch (error) {
      console.error("❌ Errore salvataggio profilo:", error);
      toast.error("Errore salvataggio profilo");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLE ELIMINAZIONE ACCOUNT
  // ============================================
  const handleDeleteAccount = async () => {
    // Verifica che l'utente abbia scritto "ELIMINA"
    if (deleteConfirmText !== "ELIMINA") {
      toast.error("Scrivi 'ELIMINA' per confermare");
      return;
    }

    setLoading(true);

    const result = await deleteAccount();

    if (result.success) {
      toast.success("Account eliminato con successo");
      logout(); // Logout dall'app
      onClose(); // Chiudi modal
      navigate("/login"); // Redirect a login
    } else {
      toast.error(result.error || "Errore eliminazione account");
      setLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        
        {/* ========== HEADER ========== */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800">Modifica Profilo</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ========== BODY ========== */}
        <div className="p-6 space-y-6">
          
          {/* ===== SEZIONE AVATAR ===== */}
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

              {/* Bottone rimuovi avatar (X rossa) */}
              {avatarPreview && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={loading}
                  title="Rimuovi avatar"
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition disabled:opacity-50 shadow-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Bottone upload avatar */}
            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={loading}
              />
              📸 Cambia Avatar
            </label>

            <p className="text-xs text-gray-500 text-center">
              Max 5MB • JPG, PNG, GIF
            </p>
          </div>

          {/* ===== SEZIONE BIO ===== */}
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

          {/* ===== ZONA PERICOLO - ELIMINAZIONE ACCOUNT ===== */}
          <div className="border-t-2 border-red-200 pt-6">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Zona Pericolo</span>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              L'eliminazione dell'account è <strong>permanente e irreversibile</strong>
            </p>

            {!showDeleteConfirm ? (
              // Bottone "Elimina Account" (non ancora confermato)
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Elimina Account</span>
              </button>
            ) : (
              // Conferma eliminazione (form con input "ELIMINA")
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <p className="text-red-800 font-bold mb-3">
                  ⚠️ SEI ASSOLUTAMENTE SICURO?
                </p>
                <ul className="text-sm text-red-700 mb-4 space-y-1 list-disc list-inside">
                  <li>Tutti i tuoi <strong>post</strong> verranno eliminati</li>
                  <li>Tutti i tuoi <strong>commenti</strong> verranno eliminati</li>
                  <li>Tutti i tuoi <strong>like</strong> verranno eliminati</li>
                  <li>I tuoi <strong>follower/following</strong> verranno eliminati</li>
                  <li><strong>Questa azione NON può essere annullata!</strong></li>
                </ul>

                <div className="mb-3">
                  <label className="block text-sm font-semibold text-red-800 mb-1">
                    Scrivi "ELIMINA" per confermare:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="ELIMINA"
                    disabled={loading}
                    className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono uppercase disabled:opacity-50"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    disabled={loading}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "ELIMINA" || loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Eliminazione..." : "Conferma Eliminazione"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========== FOOTER - BOTTONI SALVA/ANNULLA ========== */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
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
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Salva Modifiche</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;