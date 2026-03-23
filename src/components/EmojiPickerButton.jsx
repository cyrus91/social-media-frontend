import { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";

function EmojiPickerButton({ onEmojiSelect, theme = "light" }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Chiudi cliccando fuori su desktop
  useEffect(() => {
    if (!open || isMobile) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, isMobile]);

  const handleSelect = (emojiData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    // ⚠️ Questo div con position:relative è fondamentale —
    // serve da ancora per il picker in position:absolute su desktop
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-gray-400 hover:text-yellow-500 transition p-1 rounded-full hover:bg-gray-100 text-base leading-none"
        title="Aggiungi emoji">
        😊
      </button>

      {open && (
        <>
          {isMobile ? (
            <>
              {/* Overlay mobile */}
              <div
                style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.3)" }}
                onClick={() => setOpen(false)}
              />
              {/* Bottom sheet */}
              <div style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                zIndex: 9999, background: "white",
                borderRadius: "16px 16px 0 0",
                boxShadow: "0 -4px 20px rgba(0,0,0,0.15)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                  <span style={{ fontWeight: 600, color: "#374151" }}>Scegli emoji</span>
                  <button onClick={() => setOpen(false)}
                    style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af" }}>✕</button>
                </div>
                <EmojiPicker
                  onEmojiClick={handleSelect}
                  theme={theme}
                  width="100%"
                  height={300}
                  searchPlaceholder="Cerca emoji..."
                  previewConfig={{ showPreview: false }}
                />
              </div>
            </>
          ) : (
            /* Desktop: position:absolute agganciato al wrapper div */
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              right: 0,
              zIndex: 9999,
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              borderRadius: 12,
              overflow: "hidden"
            }}>
              <EmojiPicker
                onEmojiClick={handleSelect}
                theme={theme}
                width={300}
                height={350}
                searchPlaceholder="Cerca emoji..."
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EmojiPickerButton;