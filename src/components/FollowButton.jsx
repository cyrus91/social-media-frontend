import { useState, useEffect } from "react";
import { followUser, unfollowUser, checkIfFollowing } from "../services/followService";
import toast from "react-hot-toast";

function FollowButton({ userId, username, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Controlla lo stato iniziale
  useEffect(() => {
    const checkStatus = async () => {
      setCheckingStatus(true);
      const result = await checkIfFollowing(userId);
      if (result.success) {
        setIsFollowing(result.isFollowing);
      }
      setCheckingStatus(false);
    };

    checkStatus();
  }, [userId]);

  const handleToggleFollow = async () => {
    if (loading) return;

    setLoading(true);

    let result;
    if (isFollowing) {
      result = await unfollowUser(userId);
      if (result.success) {
        setIsFollowing(false);
        toast.success(`Non segui più ${username}`);
        if (onFollowChange) onFollowChange(false);
      } else {
        toast.error(result.error);
      }
    } else {
      result = await followUser(userId);
      if (result.success) {
        setIsFollowing(true);
        toast.success(`Ora segui ${username}`);
        if (onFollowChange) onFollowChange(true);
      } else {
        toast.error(result.error);
      }
    }

    setLoading(false);
  };

  // Loading status check
  if (checkingStatus) {
    return (
      <button
        disabled
        className="bg-gray-200 text-gray-500 font-semibold px-6 py-2 rounded-lg cursor-not-allowed">
        Caricamento...
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50 ${
        isFollowing
          ? "bg-gray-200 hover:bg-gray-300 text-gray-800"
          : "bg-blue-500 hover:bg-blue-600 text-white"
      }`}>
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>{isFollowing ? "Rimozione..." : "Aggiunta..."}</span>
        </div>
      ) : (
        <span>{isFollowing ? "Segui già" : "Segui"}</span>
      )}
    </button>
  );
}

export default FollowButton;