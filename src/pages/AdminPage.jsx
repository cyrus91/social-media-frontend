import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import { getReports, updateReportStatus } from "../services/reportService";

const SPINNER = (
  <div style={{ width: "22px", height: "22px", border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
);

function AdminPage() {
  const currentUser = useAuthStore(s => s.user);
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState("PENDING");
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "posts") fetchPosts();
    if (activeTab === "reports") fetchReports();
  }, [activeTab, reportFilter]);

  const fetchStats = async () => {
    try { const res = await api.get("/admin/stats"); setStats(res.data); }
    catch { toast.error("Errore caricamento statistiche"); }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    const res = await getReports(reportFilter);
    if (res.success) setReports(res.data?.content || []);
    setReportsLoading(false);
  };

  const handleReportStatus = async (reportId, status) => {
    const res = await updateReportStatus(reportId, status);
    if (res.success) {
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast.success(status === "REVIEWED" ? "Segnalazione accettata" : "Segnalazione respinta");
    }
  };
  const fetchUsers = async () => {
    setLoading(true);
    try { const res = await api.get("/admin/users"); setUsers(res.data); }
    catch { toast.error("Errore caricamento utenti"); }
    finally { setLoading(false); }
  };
  const fetchPosts = async () => {
    setLoading(true);
    try { const res = await api.get("/admin/posts"); setPosts(res.data); }
    catch { toast.error("Errore caricamento post"); }
    finally { setLoading(false); }
  };

  const handleBan = async (userId, username, banned) => {
    if (!confirm(`${banned ? "Sbanna" : "Banna"} @${username}?`)) return;
    try {
      const res = await api.put(`/admin/users/${userId}/ban`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: res.data.banned } : u));
      toast.success(`@${username} ${res.data.banned ? "bannato" : "sbannato"}`);
    } catch (e) { toast.error(e.response?.data?.message || "Errore"); }
  };
  const handleRole = async (userId, username, currentRole) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Cambia ruolo di @${username} a ${newRole}?`)) return;
    try {
      const res = await api.put(`/admin/users/${userId}/role`, null, { params: { role: newRole } });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: res.data.role } : u));
      toast.success(`Ruolo di @${username} aggiornato a ${newRole}`);
    } catch (e) { toast.error(e.response?.data?.message || "Errore"); }
  };
  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Elimina definitivamente @${username}? Questa azione è irreversibile.`)) return;
    try { await api.delete(`/admin/users/${userId}`); setUsers(prev => prev.filter(u => u.id !== userId)); toast.success(`@${username} eliminato`); fetchStats(); }
    catch (e) { toast.error(e.response?.data?.message || "Errore"); }
  };
  const handleDeletePost = async (postId) => {
    if (!confirm("Elimina questo post?")) return;
    try { await api.delete(`/admin/posts/${postId}`); setPosts(prev => prev.filter(p => p.id !== postId)); toast.success("Post eliminato"); fetchStats(); }
    catch (e) { toast.error(e.response?.data?.message || "Errore"); }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const STAT_COLORS = [
    { label: "Utenti totali", key: "totalUsers", accent: "#7c3aed" },
    { label: "Post totali", key: "totalPosts", accent: "#0891b2" },
    { label: "Commenti totali", key: "totalComments", accent: "#f59e0b" },
    { label: "Utenti bannati", key: "bannedUsers", accent: "#ef4444" },
    { label: "Admin", key: "adminUsers", accent: "#8b5cf6" },
  ];

  const TABS = [
    { id: "stats", label: "📊 Statistiche" },
    { id: "users", label: "👥 Utenti" },
    { id: "posts", label: "📝 Post" },
    { id: "reports", label: "🚩 Segnalazioni" },
  ];

  const TH = ({ children, center }) => (
    <th style={{ padding: "10px 14px", textAlign: center ? "center" : "left", fontSize: "11px", fontWeight: 700, color: "var(--nx-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", background: "var(--nx-surface-2)", borderBottom: "1px solid var(--nx-border)" }}>
      {children}
    </th>
  );
  const TD = ({ children, center, muted }) => (
    <td style={{ padding: "12px 14px", textAlign: center ? "center" : "left", fontSize: "13px", color: muted ? "var(--nx-text-muted)" : "var(--nx-text)", borderBottom: "1px solid var(--nx-border)" }}>
      {children}
    </td>
  );

  return (
    <div className="nx-page">
      <Navbar />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontWeight: 800, fontSize: "22px", color: "var(--nx-text)" }}>🛡️ Pannello Admin</h1>
          <p style={{ fontSize: "13px", color: "var(--nx-text-muted)", marginTop: "4px" }}>Gestisci utenti, contenuti e monitora le statistiche</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", padding: "4px", marginBottom: "20px", width: "fit-content", boxShadow: "var(--nx-shadow-sm)" }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: "7px 16px", borderRadius: "var(--nx-radius-sm)", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer", transition: "all var(--nx-transition)", background: activeTab === tab.id ? "var(--nx-grad-btn)" : "none", color: activeTab === tab.id ? "#fff" : "var(--nx-text-muted)" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* STATS */}
        {activeTab === "stats" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
            {STAT_COLORS.map(({ label, key, accent }) => (
              <div key={key} style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", padding: "20px 16px", borderLeft: `4px solid ${accent}`, boxShadow: "var(--nx-shadow-sm)" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--nx-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{label}</p>
                <p style={{ fontSize: "28px", fontWeight: 800, color: "var(--nx-text)" }}>{stats?.[key] ?? "..."}</p>
              </div>
            ))}
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", overflow: "hidden", boxShadow: "var(--nx-shadow-sm)" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--nx-border)" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <svg width="14" height="14" fill="none" stroke="var(--nx-text-subtle)" viewBox="0 0 24 24" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Cerca per username o email..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: "30px", paddingRight: "12px", paddingTop: "7px", paddingBottom: "7px", width: "280px", background: "var(--nx-input-bg)", border: "1.5px solid var(--nx-input-border)", borderRadius: "var(--nx-radius-full)", fontSize: "13px", color: "var(--nx-text)", outline: "none", transition: "border-color var(--nx-transition)" }}
                  onFocus={e => e.target.style.borderColor = "rgba(124,58,237,0.5)"}
                  onBlur={e => e.target.style.borderColor = "var(--nx-border)"} />
              </div>
            </div>
            {loading ? (
              <div style={{ padding: "48px 0", display: "flex", justifyContent: "center" }}>{SPINNER}</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <TH>Utente</TH><TH>Email</TH><TH center>Post</TH><TH center>Ruolo</TH><TH center>Stato</TH><TH center>Azioni</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} style={{ opacity: user.banned ? 0.6 : 1, transition: "background var(--nx-transition)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <TD>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.username} style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" }} />
                            ) : (
                              <div className="nx-avatar-gradient" style={{ width: "30px", height: "30px", fontSize: "11px" }}>
                                {user.username?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span style={{ fontWeight: 600 }}>@{user.username}</span>
                          </div>
                        </TD>
                        <TD muted>{user.email}</TD>
                        <TD center muted>{user.postCount || 0}</TD>
                        <TD center>
                          <span style={{ padding: "2px 8px", borderRadius: "var(--nx-radius-full)", fontSize: "11px", fontWeight: 700, background: user.role === "ADMIN" ? "rgba(124,58,237,0.12)" : "var(--nx-surface-2)", color: user.role === "ADMIN" ? "#7c3aed" : "var(--nx-text-muted)", border: `1px solid ${user.role === "ADMIN" ? "rgba(124,58,237,0.3)" : "var(--nx-border)"}` }}>
                            {user.role || "USER"}
                          </span>
                        </TD>
                        <TD center>
                          <span style={{ padding: "2px 8px", borderRadius: "var(--nx-radius-full)", fontSize: "11px", fontWeight: 700, background: user.banned ? "rgba(239,68,68,0.1)" : !user.emailVerified ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)", color: user.banned ? "#ef4444" : !user.emailVerified ? "#f59e0b" : "#16a34a", border: `1px solid ${user.banned ? "rgba(239,68,68,0.25)" : !user.emailVerified ? "rgba(245,158,11,0.25)" : "rgba(34,197,94,0.25)"}` }}>
                            {user.banned ? "Bannato" : !user.emailVerified ? "In attesa" : "Attivo"}
                          </span>
                        </TD>
                        <td style={{ padding: "12px 14px", textAlign: "center", borderBottom: "1px solid var(--nx-border)" }}>
                          {user.id !== currentUser?.id ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                              <button onClick={() => handleBan(user.id, user.username, user.banned)}
                                style={{ padding: "3px 10px", borderRadius: "var(--nx-radius-sm)", fontSize: "11px", fontWeight: 700, cursor: "pointer", border: "none", background: user.banned ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)", color: user.banned ? "#16a34a" : "#d97706", transition: "opacity var(--nx-transition)" }}
                                onMouseEnter={e => e.currentTarget.style.opacity = "0.75"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                                {user.banned ? "Sbanna" : "Banna"}
                              </button>
                              <button onClick={() => handleRole(user.id, user.username, user.role)}
                                style={{ padding: "3px 10px", borderRadius: "var(--nx-radius-sm)", fontSize: "11px", fontWeight: 700, cursor: "pointer", border: "none", background: "rgba(124,58,237,0.1)", color: "#7c3aed", transition: "opacity var(--nx-transition)" }}
                                onMouseEnter={e => e.currentTarget.style.opacity = "0.75"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                                {user.role === "ADMIN" ? "→ USER" : "→ ADMIN"}
                              </button>
                              <button onClick={() => handleDeleteUser(user.id, user.username)}
                                style={{ padding: "3px 10px", borderRadius: "var(--nx-radius-sm)", fontSize: "11px", fontWeight: 700, cursor: "pointer", border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", transition: "opacity var(--nx-transition)" }}
                                onMouseEnter={e => e.currentTarget.style.opacity = "0.75"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                                Elimina
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--nx-text-subtle)", fontStyle: "italic" }}>Tu</span>
                          )}
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
          <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", overflow: "hidden", boxShadow: "var(--nx-shadow-sm)" }}>
            {loading ? (
              <div style={{ padding: "48px 0", display: "flex", justifyContent: "center" }}>{SPINNER}</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <TH>Autore</TH><TH>Contenuto</TH><TH center>Commenti</TH><TH center>Data</TH><TH center>Azioni</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post.id} style={{ transition: "background var(--nx-transition)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <TD><span style={{ fontWeight: 600 }}>@{post.authorUsername}</span></TD>
                        <td style={{ padding: "12px 14px", fontSize: "13px", color: "var(--nx-text-muted)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid var(--nx-border)" }}>
                          {post.content || "—"}
                        </td>
                        <TD center muted>{post.commentCount || 0}</TD>
                        <TD center muted>{new Date(post.createdAt).toLocaleDateString("it-IT")}</TD>
                        <td style={{ padding: "12px 14px", textAlign: "center", borderBottom: "1px solid var(--nx-border)" }}>
                          <button onClick={() => handleDeletePost(post.id)}
                            style={{ padding: "3px 10px", borderRadius: "var(--nx-radius-sm)", fontSize: "11px", fontWeight: 700, cursor: "pointer", border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", transition: "opacity var(--nx-transition)" }}
                            onMouseEnter={e => e.currentTarget.style.opacity = "0.75"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
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

        {/* ── REPORTS TAB ── */}
        {activeTab === "reports" && (
          <div style={{ background: "var(--nx-surface)", border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)", overflow: "hidden", boxShadow: "var(--nx-shadow-sm)" }}>
            {/* Filtri */}
            <div style={{ display: "flex", gap: "8px", padding: "16px", borderBottom: "1px solid var(--nx-border)" }}>
              {["PENDING", "REVIEWED", "DISMISSED"].map(f => (
                <button key={f} onClick={() => setReportFilter(f)}
                  style={{ padding: "5px 14px", borderRadius: "999px", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all var(--nx-transition)", background: reportFilter === f ? "var(--nx-grad-btn)" : "var(--nx-surface-2)", color: reportFilter === f ? "#fff" : "var(--nx-text-muted)" }}>
                  {f === "PENDING" ? "⏳ In attesa" : f === "REVIEWED" ? "✅ Accettate" : "❌ Respinte"}
                </button>
              ))}
            </div>

            {reportsLoading ? (
              <div style={{ padding: "48px 0", display: "flex", justifyContent: "center" }}>{SPINNER}</div>
            ) : reports.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: "var(--nx-text-muted)", fontSize: "14px" }}>
                Nessuna segnalazione {reportFilter === "PENDING" ? "in attesa" : reportFilter === "REVIEWED" ? "accettata" : "respinta"}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <TH>Segnalato da</TH>
                      <TH>Post</TH>
                      <TH center>Motivo</TH>
                      <TH center>Data</TH>
                      {reportFilter === "PENDING" && <TH center>Azioni</TH>}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id} style={{ transition: "background var(--nx-transition)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <TD><span style={{ fontWeight: 600 }}>@{r.reporterUsername}</span></TD>
                        <td style={{ padding: "12px 14px", fontSize: "13px", color: "var(--nx-text-muted)", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: "1px solid var(--nx-border)" }}>
                          <span style={{ fontSize: "11px", color: "var(--nx-text-subtle)" }}>@{r.postAuthorUsername}: </span>
                          {r.postContent || "—"}
                        </td>
                        <TD center>
                          <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                            {r.reason?.replace("_", " ")}
                          </span>
                        </TD>
                        <TD center muted>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("it-IT") : "—"}</TD>
                        {reportFilter === "PENDING" && (
                          <td style={{ padding: "12px 14px", textAlign: "center", borderBottom: "1px solid var(--nx-border)" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              <button onClick={() => handleReportStatus(r.id, "REVIEWED")}
                                style={{ padding: "4px 12px", borderRadius: "999px", border: "none", background: "rgba(16,185,129,0.1)", color: "#10b981", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
                                ✓ Accetta
                              </button>
                              <button onClick={() => handleReportStatus(r.id, "DISMISSED")}
                                style={{ padding: "4px 12px", borderRadius: "999px", border: "none", background: "rgba(124,58,237,0.08)", color: "var(--nx-text-muted)", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
                                ✗ Respingi
                              </button>
                            </div>
                          </td>
                        )}
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