import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import SearchBar from "./SearchBar";
import toast from "react-hot-toast";

function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Chiudi dropdown quando clicchi fuori
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // Chiudi dropdown
    setDropdownOpen(false);
    
    // Mostra toast di conferma personalizzato
    toast((t) => (
      <div className="flex flex-col space-y-3">
        <p className="font-semibold text-white-800">
          Sei sicuro di voler uscire?
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              logout();
              toast.dismiss(t.id);
              toast.success("Logout effettuato! 👋");
              navigate("/login");
            }}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition">
            Sì, esci
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg transition">
            Annulla
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: "top-center",
    });
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/feed"
            className="flex items-center space-x-2 text-blue-500 font-bold text-xl hover:text-blue-600 transition">
            <svg
              className="w-8 h-8"
              fill="currentColor"
              viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            <span>Social App</span>
          </Link>

          {/* Links */}
          <div className="flex items-center space-x-6">
            <NavLink
              to="/feed"
              className={({ isActive }) =>
                `hover:text-blue-400 transition ${
                  isActive ? "text-blue-500 font-semibold" : ""
                }`
              }>
              Home
            </NavLink>

            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `hover:text-blue-400 transition ${
                  isActive ? "text-blue-500 font-semibold" : ""
                }`
              }>
              Esplora
            </NavLink>

            {/* Icona Notifiche */}
            <button
              onClick={() => toast("Notifiche - Coming soon!")}
              className="relative hover:text-blue-400 transition text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                3
              </span>
            </button>

            {/* Search Bar */}
            <SearchBar />

            {/* Dropdown utente */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-gradient-to-br from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full hover:opacity-90 transition">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold">{user?.username}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <Link
                    to={`/profile/${user?.username}`}
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition">
                    Il mio profilo
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition">
                    Impostazioni
                  </Link>

                  <hr className="my-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition">
                    Esci
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;