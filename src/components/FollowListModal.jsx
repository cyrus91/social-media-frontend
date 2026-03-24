import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AvatarZoom from "./AvatarZoom";

function FollowListModal({ isOpen, onClose, userId, type }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen || !userId) return;
    let ignore = false;

    const fetchList = async () => {
      setLoading(true);
      try {
        const endpoint = type === "followers"
          ? `/follows/user/${userId}/followers`
          : `/follows/user/${userId}/following`;
        const response = await api.get(endpoint);
        if (!ignore) setUsers(response.data || []);
      } catch (err) {
        console.error("Errore caricamento lista:", err);
        if (!ignore) setUsers([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchList();
    return () => { ignore = true; };
  }, [isOpen, userId, type]);

  const handleUserClick = (username) => {
    onClose();
    navigate(`/profile/${username}`);
  };

  if (!isOpen) return null;

  const title = type === "followers" ? "Followers" : "Following";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 py-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              {type === "followers" ? "Nessun follower" : "Non segue nessuno"}
            </div>
          ) : (
            users.map((follow) => {
              const username = type === "followers"
                ? follow.followerUsername
                : follow.followedUsername;
              const avatarUrl = type === "followers"
                ? follow.followerAvatarUrl
                : follow.followedAvatarUrl;

              return (
                <button
                  key={username}
                  onClick={() => handleUserClick(username)}
                  className="w-full flex items-center space-x-3 px-5 py-3 hover:bg-gray-50 transition text-left">
                  <AvatarZoom src={avatarUrl} username={username} size="sm" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">@{username}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowListModal;