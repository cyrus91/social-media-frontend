import { useEffect } from "react";
import { createPortal } from "react-dom";

function Drawer({ isOpen, onClose, title, children, size = "md", showPostPreview = false, postContent = null }) {
  // ============================================
  // LOCK BODY SCROLL QUANDO APERTO
  // ============================================
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // ============================================
  // GESTIONE ESC KEY
  // ============================================
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ============================================
  // SIZE VARIANTS
  // ============================================
  const sizeClasses = {
    sm: "md:max-w-sm",
    md: "md:max-w-md",
    lg: "md:max-w-lg",
    xl: "md:max-w-xl",
    full: "md:max-w-full",
  };

  // ============================================
  // RENDER CON PORTAL
  // ============================================
  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay (backdrop) */}
      <div
        className="fixed inset-0 bg-black transition-opacity duration-300"
        style={{ 
          backgroundColor: showPostPreview ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Layout: Post Preview (desktop) + Drawer */}
      <div className="relative w-full h-full flex items-center justify-center md:justify-end">
        
        {/* Post Preview (solo desktop se showPostPreview) */}
        {showPostPreview && postContent && (
          <div className="hidden md:flex flex-1 items-center justify-center px-8 max-w-3xl">
            <div className="relative z-10 w-full">
              {postContent}
            </div>
          </div>
        )}

        {/* Drawer Panel */}
        <div
          className={`
            relative w-full ${sizeClasses[size]}
            h-full md:h-[90vh] md:rounded-l-2xl
            bg-white shadow-2xl
            transform transition-transform duration-300 ease-in-out
            flex flex-col
            ${isOpen ? "translate-x-0" : "translate-x-full"}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h2 id="drawer-title" className="text-xl font-bold text-gray-800">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100"
              aria-label="Chiudi">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content (scrollable) */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Drawer;