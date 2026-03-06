import { useState, useEffect } from "react";
import {
  followUser,
  unfollowUser,
  checkIsFollowing,
} from "../services/userService";
import toast from "react-hot-toast";

function FollowButton({ userId, username, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(true);

  // Check if already following
  useEffect(() => {
    const checkFollowStatus = async () => {
      setCheckingFollow(true);
      const result = await checkIsFollowing(userId);

      if (result.success) {
        setIsFollowing(result.data.isFollowing || false);
      }

      setCheckingFollow(false);
    };

    checkFollowStatus();
  }, [userId]);

  const handleToggleFollow = async () => {
    setLoading(true);

    if (isFollowing) {
      // Unfollow
      const result = await unfollowUser(userId);

      if (result.success) {
        setIsFollowing(false);
        toast.success(`Non segui più ${username}`);

        if (onFollowChange) {
          onFollowChange(false);
        }
      } else {
        toast.error(result.error);
      }
    } else {
      // Follow
      const result = await followUser(userId);

      if (result.success) {
        setIsFollowing(true);
        toast.success(`Ora segui ${username}!`);

        if (onFollowChange) {
          onFollowChange(true);
        }
      } else {
        toast.error(result.error);
      }
    }

    setLoading(false);
  };

  if (checkingFollow) {
    return (
      <button
        disabled
        className="flex items-center space-x-2 bg-gray-200 text-gray-500 font-semibold px-6 py-2 rounded-lg">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <span>Caricamento...</span>
      </button>
    );
  }

  if (isFollowing) {
    // Already following - show "Following" button
    return (
      <button
        onClick={handleToggleFollow}
        disabled={loading}
        className="flex items-center space-x-2 bg-gray-200 hover:bg-red-50 text-gray-800 hover:text-red-600 font-semibold px-6 py-2 rounded-lg transition border-2 border-transparent hover:border-red-300 group disabled:opacity-50">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span className="group-hover:hidden">Following</span>
        <span className="hidden group-hover:inline">Unfollow</span>
      </button>
    );
  }

  // Not following - show "Follow" button
  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition shadow-lg hover:shadow-xl disabled:opacity-50">
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
        />
      </svg>
      <span>{loading ? "Caricamento..." : "Segui"}</span>
    </button>
  );
}

export default FollowButton;
