import { useState } from "react";

function AvatarZoom({ src, username, size = "md", className = "" }) {
  const [zoomed, setZoomed] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-16 h-16 text-xl",
    xl: "w-24 h-24 text-2xl",
  };

  const initial = username?.charAt(0).toUpperCase() || "?";

  const handleAvatarClick = (e) => {
    if (!src) return;
    e.preventDefault();      // blocca navigazione Link padre
    e.stopPropagation();     // blocca bubble
    setZoomed(true);
  };

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setZoomed(false);
  };

  return (
    <>
      <div
        className={`${sizeClasses[size]} rounded-full flex-shrink-0 ${src ? "cursor-zoom-in" : ""} ${className}`}
        onClick={handleAvatarClick}>
        {src ? (
          <img
            src={src}
            alt={username}
            className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-transparent hover:ring-blue-400 transition-shadow`}
          />
        ) : (
          <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold`}>
            {initial}
          </div>
        )}
      </div>

      {/* Overlay zoom — solo quando zoomed è true */}
      {zoomed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999]"
          onClick={handleClose}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={src}
              alt={username}
              className="w-64 h-64 rounded-full object-cover shadow-2xl border-4 border-white"
            />
            <button
              type="button"
              onClick={handleClose}
              className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 transition font-bold">
              ✕
            </button>
            <p className="text-white text-center mt-3 font-semibold">@{username}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default AvatarZoom;