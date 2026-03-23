import { useState } from "react";
import { createPortal } from "react-dom";

function AvatarZoom({ src, username, size = "md", className = "" }) {
  const [zoomed, setZoomed] = useState(false);

  const sizeClasses = {
    sm:      "w-8 h-8 text-sm",
    md:      "w-10 h-10 text-base",
    lg:      "w-16 h-16 text-xl",
    xl:      "w-24 h-24 text-2xl",
    profile: "w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 text-3xl sm:text-4xl md:text-5xl",
  };

  const borderClasses = {
    sm:      "border-2",
    md:      "border-2",
    lg:      "border-2",
    xl:      "border-2",
    profile: "border-4 border-white shadow-lg",
  };

  const initial = username?.charAt(0).toUpperCase() || "?";

  const handleClick = (e) => {
    if (!src) return;
    e.preventDefault();
    e.stopPropagation();
    setZoomed(true);
  };

  return (
    <>
      <div
        className={`${sizeClasses[size]} rounded-full flex-shrink-0 ${src ? "cursor-zoom-in" : ""} ${className}`}
        onClick={handleClick}>
        {src ? (
          <img
            src={src}
            alt={username}
            className={`${sizeClasses[size]} rounded-full object-cover ${borderClasses[size]} ring-2 ring-transparent hover:ring-blue-400 transition-shadow`}
          />
        ) : (
          <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold ${borderClasses[size]}`}>
            {initial}
          </div>
        )}
      </div>

      {zoomed && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 999999, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setZoomed(false)}>
          <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={src}
              alt={username}
              style={{ width: 280, height: 280, borderRadius: "50%", objectFit: "cover", border: "4px solid white", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
            />
            <button
              onClick={() => setZoomed(false)}
              style={{ position: "absolute", top: -12, right: -12, background: "white", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, fontWeight: "bold", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
              ✕
            </button>
            <p style={{ color: "white", textAlign: "center", marginTop: 12, fontWeight: 600 }}>
              @{username}
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default AvatarZoom;