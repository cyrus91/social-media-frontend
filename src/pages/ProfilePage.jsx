import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { fetchUserProfile } from "../services/userService";
import { fetchPosts } from "../services/postService";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import FollowButton from "../components/FollowButton";
import api from "../services/api";
import EditProfileModal from "../components/EditProfileModal";

function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [editModalOpen, setEditModalOpen] = useState(false);

  const isMyProfile = currentUser?.username === username;

  const fetchPostCount = async (userId) => {
    try {
      console.log("📊 Fetching post count for user:", userId);
      const response = await api.get(`/posts/author/${userId}/count`);
      console.log("✅ Post count ricevuto:", response.data.count);
      setProfile((prev) => ({
        ...prev,
        postCount: response.data.count,
      }));
    } catch (error) {
      console.error("❌ Errore nel caricamento del post count:", error);
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchUserProfile(username);

    if (result.success) {
      setProfile(result.data);
      fetchPostCount(result.data.id);
    } else {
      setError(result.error);
      toast.error("Utente non trovato");
    }
    setLoading(false);
  };

  useEffect(() => {
    let ignore = false;

    async function doLoadProfile() {
      await loadProfile();
    }

    if (!ignore) {
      doLoadProfile();
    }

    return () => {
      ignore = true;
    };
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    let ignore = false;

    async function doLoadPosts() {
      setPostsLoading(true);

      // ✅ USA ENDPOINT SPECIFICO PER UTENTE!
      try {
        const response = await api.get(`/posts/author/${profile.id}`, {
          params: { page: 0, size: 100 }, // Carica molti post (o usa infinite scroll dopo)
        });

        if (!ignore) {
          setPosts(response.data.content || []);
          setPostsLoading(false);
        }
      } catch (error) {
        console.error("❌ Errore caricamento post utente:", error);
        if (!ignore) {
          setPosts([]);
          setPostsLoading(false);
        }
      }
    }

    doLoadPosts();
    return () => {
      ignore = true;
    };
  }, [profile, activeTab, profile?.id, username]);

  const handleLikeUpdate = (postId, isLiked) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: isLiked,
              likeCount: isLiked ? post.likeCount + 1 : post.likeCount - 1,
            }
          : post,
      ),
    );
  };

  const handlePostDeleted = (postId) => {
    console.log(`🗑️ Post ${postId} eliminato`);
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    if (profile?.id) {
      fetchPostCount(profile.id);
    }
  };

  const formatJoinDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner size="lg" text="Caricamento profilo..." />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 p-4 mt-8 sm:mt-20">
          <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">😕</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Utente non trovato
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              L'utente @{username} non esiste o è stato eliminato.
            </p>
            <button
              onClick={() => navigate("/feed")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition text-sm sm:text-base">
              Torna al Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Profile Header - ✅ RESPONSIVE + LEGGIBILE! */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-4 sm:mb-6">
          {/* Cover Photo */}
          <div className="h-24 sm:h-32 md:h-48 bg-gradient-to-r from-blue-500 to-purple-500"></div>

          {/* Profile Info */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-5 -mt-12 sm:-mt-16">
              {/* Avatar */}
              <div className="flex justify-center sm:justify-start">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.username}
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl sm:text-4xl md:text-5xl font-bold border-4 border-white shadow-lg">
                    {profile.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name & Actions */}
              <div className="flex-1 mt-4 sm:mt-0 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {/* ✅ NOME E USERNAME LEGGIBILI (NERO SU BIANCO)! */}
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                      {profile.username}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600">
                      @{profile.username}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 sm:mt-0">
                    {isMyProfile ? (
                      <button
                        onClick={() => setEditModalOpen(true)}
                        className="flex items-center justify-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 sm:px-6 py-2 rounded-lg transition text-sm sm:text-base w-full sm:w-auto">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          Modifica profilo
                        </span>
                        <span className="sm:hidden">Modifica</span>
                      </button>
                    ) : (
                      profile.id && (
                        <FollowButton
                          userId={profile.id}
                          username={profile.username}
                          onFollowChange={async (isFollowing) => {
                            console.log(
                              "🔄 Follow cambiato - ricarico profilo...",
                            );
                            await loadProfile();
                          }}
                        />
                      )
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm sm:text-base text-gray-700 mt-3 sm:mt-4">
                    {profile.bio}
                  </p>
                )}

                {/* Join date */}
                <div className="flex items-center justify-center sm:justify-start space-x-2 text-gray-500 text-xs sm:text-sm mt-3 sm:mt-4">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Membro da {formatJoinDate(profile.createdAt)}</span>
                </div>

                {/* ✅ STATS - COUNTER PRESENTI! */}
                <div className="flex justify-center sm:justify-start space-x-4 sm:space-x-6 md:space-x-8 mt-3 sm:mt-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                      {profile.postCount || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">Post</p>
                  </div>

                  <button
                    onClick={() => toast("Followers list - Coming soon!")}
                    className="text-center hover:opacity-80 transition">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                      {profile.followerCount || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Followers
                    </p>
                  </button>

                  <button
                    onClick={() => toast("Following list - Coming soon!")}
                    className="text-center hover:opacity-80 transition">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                      {profile.followingCount || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Following
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - ✅ RESPONSIVE! */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 font-semibold transition text-sm sm:text-base ${
                activeTab === "posts"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              Post
            </button>

            <button
              onClick={() => setActiveTab("likes")}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 font-semibold transition text-sm sm:text-base ${
                activeTab === "likes"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              Mi piace
            </button>

            <button
              onClick={() => setActiveTab("media")}
              className={`flex-1 py-3 sm:py-4 px-3 sm:px-6 font-semibold transition text-sm sm:text-base ${
                activeTab === "media"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              Media
            </button>
          </div>
        </div>

        {/* Posts section */}
        {activeTab === "posts" && (
          <div>
            {postsLoading && (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" text="Caricamento post..." />
              </div>
            )}

            {!postsLoading && posts.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
                <div className="text-5xl sm:text-6xl mb-4">📭</div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                  Nessun post
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {isMyProfile
                    ? "Non hai ancora pubblicato nulla!"
                    : `${profile.username} non ha ancora pubblicato nulla.`}
                </p>
              </div>
            )}

            {!postsLoading && posts.length > 0 && (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLikeUpdate={handleLikeUpdate}
                    onPostDeleted={handlePostDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Likes section */}
        {activeTab === "likes" && (
          <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">❤️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Coming soon!
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Post piaciuti sarà disponibile a breve
            </p>
          </div>
        )}

        {/* Media section */}
        {activeTab === "media" && (
          <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">🖼️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Coming soon!
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Galleria media sarà disponibile a breve
            </p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isMyProfile && (
        <EditProfileModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          currentProfile={profile}
          onProfileUpdated={async () => {
            await loadProfile();
            setEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default ProfilePage;
