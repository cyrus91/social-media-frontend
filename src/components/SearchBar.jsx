import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsers } from "../services/userService";

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
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Cerca utenti..."
          value={query}
          onChange={handleQueryChange}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-gray-100 border border-gray-300 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Icona lente */}
        <svg
          className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Loader */}
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Dropdown risultati */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {results.length === 0 && !loading && (
            <div className="p-4 text-center text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <p>Nessun utente trovato</p>
            </div>
          )}

          {results.length > 0 && (
            <ul>
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => handleSelectUser(user.username)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-800">
                        {user.username}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.bio && (
                        <p className="text-xs text-gray-400 truncate">
                          {user.bio}
                        </p>
                      )}
                    </div>

                    {/* Freccia */}
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
