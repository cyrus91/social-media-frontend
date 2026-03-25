import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

function AdminPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "posts") fetchPosts();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch { toast.error("Errore caricamento statistiche"); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch { toast.error("Errore caricamento utenti"); }
    finally { setLoading(false); }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/posts");
      setPosts(res.data);
    } catch { toast.error("Errore caricamento post"); }
    finally { setLoading(false); }
  };

  const handleBan = async (userId, username, banned) => {
    if (!confirm(`${banned ? "Sbanna" : "Banna"} @${username}?`)) return;
    try {
      const res = await api.put(`/admin/users/${userId}/ban`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, banned: res.data.banned } : u));
      toast.success(`@${username} ${res.data.banned ? "bannato" : "sbannato"}`);
    } catch (e) { toast.error(e.response?.data?.message || "Errore"); }
  };

  const handleRole = async (userId, username, currentRole) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Cambia ruolo di @${username} a ${newRole}?`)) return;
    try {
      const res = await api.put(`/admin/users/${userId}/role`, null, { params: { role: newRole } });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: res.data.role } : u));
      toast.success(`Ruolo di @${username} aggiornato a ${newRole}`);
    } catch (e) { toast.error(e.response?.data?.message || "Errore"); }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Elimina definitivamente @${username}? Questa azione è irreversibile.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success(`@${username} eliminato`);
      fetchStats();
    } catch (e) { toast.error(e.response?.data?.message || "Errore"); }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Elimina questo post?")) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success("Post eliminato");
      fetchStats();
    } catch (e) { toast.error(e.response?.data?.message || "Errore"); }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const StatCard = ({ label, value, color }) => (
    <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${color}`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value ?? "..."}</p>
    </div>
  );

  const tabs = [
    { id: "stats", label: "📊 Statistiche" },
    { id: "users", label: "👥 Utenti" },
    { id: "posts", label: "📝 Post" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🛡️ Pannello Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Gestisci utenti, contenuti e monitora le statistiche</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white rounded-xl shadow-sm p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === tab.id ? "bg-blue-500 text-white shadow" : "text-gray-600 hover:bg-gray-100"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* STATS */}
        {activeTab === "stats" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Utenti totali" value={stats?.totalUsers} color="border-blue-500" />
            <StatCard label="Post totali" value={stats?.totalPosts} color="border-green-500" />
            <StatCard label="Commenti totali" value={stats?.totalComments} color="border-yellow-500" />
            <StatCard label="Utenti bannati" value={stats?.bannedUsers} color="border-red-500" />
            <StatCard label="Admin" value={stats?.adminUsers} color="border-purple-500" />
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <input
                type="text"
                placeholder="Cerca per username o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Utente</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-center">Post</th>
                      <th className="px-4 py-3 text-center">Ruolo</th>
                      <th className="px-4 py-3 text-center">Stato</th>
                      <th className="px-4 py-3 text-center">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className={`hover:bg-gray-50 transition ${user.banned ? "opacity-60" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.username}
                                className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                {user.username?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium text-gray-800">@{user.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{user.email}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{user.postCount || 0}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {user.role || "USER"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            user.banned
                              ? "bg-red-100 text-red-700"
                              : !user.emailVerified
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {user.banned ? "Bannato" : !user.emailVerified ? "In attesa conferma" : "Attivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            {user.id !== currentUser?.id && (
                              <>
                                <button onClick={() => handleBan(user.id, user.username, user.banned)}
                                  className={`px-2 py-1 rounded text-xs font-semibold transition ${
                                    user.banned
                                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                  }`}>
                                  {user.banned ? "Sbanna" : "Banna"}
                                </button>
                                <button onClick={() => handleRole(user.id, user.username, user.role)}
                                  className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition">
                                  {user.role === "ADMIN" ? "→ USER" : "→ ADMIN"}
                                </button>
                                <button onClick={() => handleDeleteUser(user.id, user.username)}
                                  className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition">
                                  Elimina
                                </button>
                              </>
                            )}
                            {user.id === currentUser?.id && (
                              <span className="text-xs text-gray-400 italic">Tu</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* POSTS */}
        {activeTab === "posts" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Autore</th>
                      <th className="px-4 py-3 text-left">Contenuto</th>
                      <th className="px-4 py-3 text-center">Commenti</th>
                      <th className="px-4 py-3 text-center">Data</th>
                      <th className="px-4 py-3 text-center">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-800">@{post.authorUsername}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{post.content || "—"}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{post.commentCount || 0}</td>
                        <td className="px-4 py-3 text-center text-gray-500 text-xs">
                          {new Date(post.createdAt).toLocaleDateString("it-IT")}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleDeletePost(post.id)}
                            className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition">
                            Elimina
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;