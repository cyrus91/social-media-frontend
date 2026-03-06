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

function ProfilePage() {
  const { username } = useParams(); // URL: /profile/:username
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  // State
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts"); // posts | likes | media

  // Check if it's my profile
  const isMyProfile = currentUser?.username === username;

  // Load profile
  useEffect(() => {
    let ignore = false;

    async function doLoadProfile() {
      setLoading(true);
      setError(null);

      const result = await fetchUserProfile(username);

      if (!ignore) {
        if (result.success) {
          setProfile(result.data);
        } else {
          setError(result.error);
          toast.error("Utente non trovato");
        }
        setLoading(false);
      }
    }

    doLoadProfile();
    return () => {
      ignore = true;
    };
  }, [username]);

  // Load posts quando cambia profilo
  useEffect(() => {
    if (!profile) return;
    let ignore = false;

    async function doLoadPosts() {
      setPostsLoading(true);

      // TODO: Implementare endpoint per post utente specifico
      // Per ora usiamo fetchPosts generico
      const result = await fetchPosts(0, 20);

      if (!ignore) {
        if (result.success) {
          // Filtra solo post di questo utente
          const userPosts = (result.data.content || result.data).filter(
            (post) => post.authorUsername === username,
          );
          setPosts(userPosts);
        }
        setPostsLoading(false);
      }
    }

    doLoadPosts();
    return () => {
      ignore = true;
    };
  }, [profile, activeTab, username]);

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

  // Format date
  const formatJoinDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      month: "long",
      year: "numeric",
    });
  };

  // Loading state
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

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-2xl mx-auto p-4 mt-20">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Utente non trovato
            </h2>
            <p className="text-gray-600 mb-6">
              L'utente @{username} non esiste o è stato eliminato.
            </p>
            <button
              onClick={() => navigate("/feed")}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition">
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

      <div className="max-w-4xl mx-auto p-4 mt-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {/* Top section */}
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-5xl shadow-lg">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              {/* Username + Button */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    {profile.username}
                  </h1>
                  <p className="text-gray-500">@{profile.username}</p>
                </div>

                {/* Edit button (se è il tuo profilo) */}
                {isMyProfile && (
                  <button
                    onClick={() => toast("Edit profile - Coming soon!")}
                    className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-2 rounded-lg transition">
                    <svg
                      className="w-5 h-5"
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
                    <span>Modifica profilo</span>
                  </button>
                )}

                {/* Follow button (se NON è il tuo profilo) */}
                {!isMyProfile && profile.id && (
                  <FollowButton
                    userId={profile.id}
                    username={profile.username}
                    onFollowChange={(isFollowing) => {
                      // Aggiorna contatore followers
                      setProfile((prev) => ({
                        ...prev,
                        followerCount: isFollowing
                          ? (prev.followerCount || 0) + 1
                          : (prev.followerCount || 1) - 1,
                      }));
                    }}
                  />
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 mb-4">{profile.bio}</p>
              )}

              {/* Join date */}
              <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4">
                <svg
                  className="w-4 h-4"
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

              {/* Stats */}
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">
                    {profile.postCount ?? 0}
                  </p>
                  <p className="text-gray-500 text-sm">Post</p>
                </div>

                <button
                  onClick={() => toast("Followers list - Coming soon!")}
                  className="text-center hover:opacity-80 transition">
                  <p className="text-2xl font-bold text-gray-800">
                    {profile.followerCount ?? 0}
                  </p>
                  <p className="text-gray-500 text-sm">Followers</p>
                </button>

                <button
                  onClick={() => toast("Following list - Coming soon!")}
                  className="text-center hover:opacity-80 transition">
                  <p className="text-2xl font-bold text-gray-800">
                    {profile.followingCount ?? 0}
                  </p>
                  <p className="text-gray-500 text-sm">Following</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === "posts"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              Post
            </button>

            <button
              onClick={() => setActiveTab("likes")}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === "likes"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              Mi piace
            </button>

            <button
              onClick={() => setActiveTab("media")}
              className={`flex-1 py-4 px-6 font-semibold transition ${
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
              <LoadingSpinner size="lg" text="Caricamento post..." />
            )}

            {!postsLoading && posts.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Nessun post
                </h2>
                <p className="text-gray-600">
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
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Likes section */}
        {activeTab === "likes" && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Coming soon!
            </h2>
            <p className="text-gray-600">
              Post piaciuti sarà disponibile a breve
            </p>
          </div>
        )}

        {/* Media section */}
        {activeTab === "media" && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🖼️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Coming soon!
            </h2>
            <p className="text-gray-600">
              Galleria media sarà disponibile a breve
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
