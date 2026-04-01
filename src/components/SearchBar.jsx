import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsers } from "../services/userService";

// SearchBar redesignata con Nexus design system
function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Chiudi dropdown quando clicchi fuori
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
    } else {
      setLoading(true);
    }
  };

  // Debounce search (aspetta 300ms dopo che l'utente smette di scrivere)
  useEffect(() => {
    if (query.trim().length === 0) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      const result = await searchUsers(query);
      if (result.success) {
        setResults(result.data);
        setIsOpen(true);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectUser = (username) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    navigate(`/profile/${username}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} style={{ position: "relative", width: "100%", maxWidth: "360px" }}>
      {/* Input */}
      <div style={{ position: "relative" }}>
        <svg
          style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--nx-text-subtle)", pointerEvents: "none" }}
          width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Cerca utenti..."
          value={query}
          onChange={handleQueryChange}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(124,58,237,0.5)";
            e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
            if (query.length > 0) setIsOpen(true);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--nx-border)";
            e.target.style.boxShadow = "none";
          }}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            background: "var(--nx-input-bg)",
            border: "1.5px solid var(--nx-input-border)",
            borderRadius: "var(--nx-radius-full)",
            padding: "7px 36px 7px 32px",
            fontSize: "13px",
            color: "var(--nx-text)",
            outline: "none",
            transition: "border-color var(--nx-transition), box-shadow var(--nx-transition)",
          }}
        />
        {loading && (
          <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
            <div style={{
              width: "14px", height: "14px",
              border: "2px solid rgba(124,58,237,0.25)",
              borderTopColor: "#7c3aed",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite"
            }} />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, width: "100%",
          background: "var(--nx-surface)",
          border: "1px solid var(--nx-border)",
          borderRadius: "var(--nx-radius-lg)",
          boxShadow: "var(--nx-shadow-lg)",
          maxHeight: "320px", overflowY: "auto", zIndex: 60,
        }}>
          {results.length === 0 && !loading && (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--nx-text-muted)", fontSize: "13px" }}>
              <div style={{ fontSize: "28px", marginBottom: "6px" }}>🔍</div>
              Nessun utente trovato
            </div>
          )}
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user.username)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 14px", background: "none", border: "none", cursor: "pointer",
                textAlign: "left", transition: "background var(--nx-transition)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username}
                  style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div className="nx-avatar-gradient" style={{ width: "34px", height: "34px", fontSize: "12px", flexShrink: 0 }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "13px", color: "var(--nx-text)", marginBottom: "1px" }}>
                  {user.username}
                </p>
                {user.bio && (
                  <p style={{ fontSize: "11px", color: "var(--nx-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.bio}
                  </p>
                )}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--nx-text-subtle)" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;