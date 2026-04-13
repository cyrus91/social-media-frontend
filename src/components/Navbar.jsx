import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import useThemeStore from "../store/themeStore";
import toast from "react-hot-toast";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import useMessagingStore from "../store/messagingStore";
import NexusLogo from "./NexusLogo";

const NxNavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
  
  return (
    <Link to={to} style={{
      display: "flex", alignItems: "center", gap: "6px",
      padding: "6px 12px", borderRadius: "var(--nx-radius-sm)",
      fontSize: "14px", fontWeight: 500, textDecoration: "none",
      transition: "all var(--nx-transition)",
      color: isActive ? "#7c3aed" : "var(--nx-text-muted)",
      background: isActive ? "rgba(124,58,237,0.1)" : "transparent",
    }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(124,58,237,0.06)"; e.currentTarget.style.color = "#7c3aed"; }}
    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--nx-text-muted)"; } }}>
      {children}
    </Link>
  );
};

function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const unreadMessages = useMessagingStore((state) => state.unreadCount);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Arrivederci!");
    setShowDropdown(false);
    setShowMobileMenu(false);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "var(--nx-surface)",
      borderBottom: "1px solid var(--nx-border)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", height: "60px", gap: "16px" }}>

          {/* Logo */}
          <Link to="/feed" style={{ textDecoration: "none", flexShrink: 0 }}>
            <NexusLogo size={28} />
          </Link>

          {/* Search — desktop */}
          <div className="hidden md:block" style={{ flex: 1, maxWidth: "360px" }}>
            <SearchBar />
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: "4px", flex: 1, justifyContent: "center" }}>
            <NxNavLink to="/feed">
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isActive("/feed") ? "#7c3aed" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Home
            </NxNavLink>
            <NxNavLink to="/explore">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Esplora
            </NxNavLink>
            <NxNavLink to="/bookmarks">
              <svg width="16" height="16" viewBox="0 0 24 24"
                fill={isActive("/bookmarks") ? "#7c3aed" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
              Salvati
            </NxNavLink>
          </div>

          {/* Right side actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>

            {/* Theme Toggle — solo desktop */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Passa alla modalità chiara" : "Passa alla modalità scura"}
              className="hidden md:flex"
              style={{ padding: "7px", borderRadius: "var(--nx-radius-sm)", background: "none", border: "none", cursor: "pointer", color: "var(--nx-text-muted)", alignItems: "center", justifyContent: "center", transition: "all var(--nx-transition)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
              {theme === "dark" ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5"/>
                  <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            <div className="hidden md:block">
              <NotificationBell />
            </div>

            {/* Messages */}
            <Link to="/messages" style={{ position: "relative", padding: "7px", borderRadius: "var(--nx-radius-sm)", color: "var(--nx-text-muted)", transition: "all var(--nx-transition)", display: "flex" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7c3aed"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--nx-text-muted)"; }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              {unreadMessages > 0 && (
                <span style={{
                  position: "absolute", top: "2px", right: "2px",
                  background: "var(--nx-grad-btn)",
                  color: "#fff", fontSize: "10px", fontWeight: 700,
                  width: "16px", height: "16px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid var(--nx-surface)"
                }}>
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Link>

            {/* Avatar + dropdown — solo desktop */}
            <div ref={dropdownRef} className="hidden md:block" style={{ position: "relative" }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "4px 8px 4px 4px", border: "1.5px solid var(--nx-border)",
                  borderRadius: "var(--nx-radius-full)", background: "var(--nx-surface-2)",
                  cursor: "pointer", transition: "all var(--nx-transition)"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--nx-border-hover)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--nx-border)"}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username}
                    style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div className="nx-avatar-gradient" style={{ width: "28px", height: "28px", fontSize: "11px" }}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden lg:block" style={{ fontSize: "13px", fontWeight: 600, color: "var(--nx-text)", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.username}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--nx-text-muted)" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="nx-animate-in" style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  width: "200px", background: "var(--nx-surface)",
                  border: "1px solid var(--nx-border)", borderRadius: "var(--nx-radius-lg)",
                  boxShadow: "var(--nx-shadow-lg)", overflow: "hidden", zIndex: 60
                }}>
                  {/* User info */}
                  <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--nx-border)" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--nx-text)" }}>{user?.username}</p>
                    <p style={{ fontSize: "11px", color: "var(--nx-text-muted)", marginTop: "2px" }}>Nexus member</p>
                  </div>

                  {/* Links */}
                  {[
                    { to: `/profile/${user?.username}`, label: "Il mio profilo", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
                    { to: "/messages", label: "Messaggi", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", badge: unreadMessages },
                    ...(user?.role === "ADMIN" ? [{ to: "/admin", label: "Admin Panel", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", admin: true }] : [])
                  ].map(item => (
                    <Link key={item.to} to={item.to}
                      onClick={() => setShowDropdown(false)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 16px", fontSize: "13px", fontWeight: 500,
                        color: item.admin ? "#7c3aed" : "var(--nx-text)", textDecoration: "none",
                        transition: "background var(--nx-transition)"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d={item.icon}/>
                        </svg>
                        {item.label}
                      </div>
                      {item.badge > 0 && (
                        <span style={{ background: "var(--nx-grad-btn)", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px" }}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}

                  {/* Logout */}
                  <div style={{ borderTop: "1px solid var(--nx-border)", padding: "6px" }}>
                    <button onClick={handleLogout}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "10px",
                        padding: "8px 10px", fontSize: "13px", fontWeight: 500,
                        color: "#ef4444", background: "none", border: "none", cursor: "pointer",
                        borderRadius: "var(--nx-radius-sm)", transition: "background var(--nx-transition)"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{ padding: "7px", borderRadius: "var(--nx-radius-sm)", background: "none", border: "1px solid var(--nx-border)", cursor: "pointer", color: "var(--nx-text-muted)", alignItems: "center", justifyContent: "center" }}>
              {showMobileMenu ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden nx-animate-in" style={{ borderTop: "1px solid var(--nx-border)", padding: "12px 0 16px" }}>
            <div style={{ marginBottom: "12px" }}>
              <SearchBar />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 4px", borderBottom: "1px solid var(--nx-border)", marginBottom: "8px" }}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div className="nx-avatar-gradient" style={{ width: "36px", height: "36px", fontSize: "13px" }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--nx-text)" }}>{user?.username}</p>
                <p style={{ fontSize: "11px", color: "var(--nx-text-muted)" }}>Nexus member</p>
              </div>
            </div>
            {[
              { to: "/feed", label: "Home" },
              { to: "/explore", label: "Esplora" },
              { to: "/bookmarks", label: "Salvati" },
              { to: "/messages", label: "Messaggi", badge: unreadMessages },
              { to: `/profile/${user?.username}`, label: "Profilo" },
              ...(user?.role === "ADMIN" ? [{ to: "/admin", label: "Admin Panel", admin: true }] : []),
            ].map(item => (
              <Link key={item.to} to={item.to}
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 4px", fontSize: "14px", fontWeight: 500,
                  color: item.admin ? "#7c3aed" : "var(--nx-text)", textDecoration: "none",
                  borderRadius: "var(--nx-radius-sm)"
                }}>
                {item.label}
                {item.badge > 0 && (
                  <span style={{ background: "var(--nx-grad-btn)", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px" }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            <div style={{ borderTop: "1px solid var(--nx-border)", paddingTop: "8px", marginTop: "8px" }}>
              <div style={{ padding: "4px 0" }}>
                <NotificationBell isMobile={true} onClose={() => setShowMobileMenu(false)} />
              </div>
              <button onClick={toggleTheme}
                style={{ width: "100%", textAlign: "left", padding: "10px 4px", fontSize: "14px", fontWeight: 500, color: "var(--nx-text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
                {theme === "dark" ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="5"/>
                    <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                  </svg>
                )}
                {theme === "dark" ? "Modalità chiara" : "Modalità scura"}
              </button>
              <button onClick={handleLogout}
                style={{ width: "100%", textAlign: "left", padding: "10px 4px", fontSize: "14px", fontWeight: 500, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;