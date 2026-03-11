import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    toast.promise(
      Promise.resolve().then(() => {
        logout();
        navigate("/login");
      }),
      {
        loading: "Disconnessione...",
        success: "Logout effettuato!",
        error: "Errore nel logout",
      }
    );
    setShowDropdown(false);
    setShowMobileMenu(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/feed"
            className="text-xl sm:text-2xl font-bold text-blue-600 hover:text-blue-700 transition flex-shrink-0">
            Social App
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 flex-1 justify-end">
            {/* SearchBar */}
            <div className="flex-1 max-w-md mx-4">
              <SearchBar />
            </div>

            <Link
              to="/feed"
              className="text-gray-700 hover:text-blue-600 font-semibold transition whitespace-nowrap">
              Home
            </Link>
            <Link
              to="/explore"
              className="text-gray-700 hover:text-blue-600 font-semibold transition whitespace-nowrap">
              Esplora
            </Link>

            {/* ✅ NOTIFICATION BELL DESKTOP */}
            <NotificationBell />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 focus:outline-none hover:opacity-80 transition">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-gray-700 font-semibold hidden lg:block">
                  {user?.username}
                </span>
                <svg
                  className="w-4 h-4 text-gray-500"
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

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                  <Link
                    to={`/profile/${user?.username}`}
                    onClick={() => setShowDropdown(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition">
                    Il mio profilo
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition focus:outline-none">
            {showMobileMenu ? (
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              {/* SearchBar Mobile */}
              <div className="px-4">
                <SearchBar />
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3 px-4">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-gray-700 font-semibold">
                  {user?.username}
                </span>
              </div>

              {/* Navigation Links */}
              <Link
                to="/feed"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                🏠 Home
              </Link>
              <Link
                to="/explore"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                🌍 Esplora
              </Link>

              {/* ✅ NOTIFICATION BELL MOBILE */}
              <div className="px-4">
                <NotificationBell isMobile={true} onClose={() => setShowMobileMenu(false)} />
              </div>

              <Link
                to={`/profile/${user?.username}`}
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                👤 Il mio profilo
              </Link>
              <button
                onClick={handleLogout}
                className="text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded-lg transition">
                🚪 Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;