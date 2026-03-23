import { useState, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";

function EmojiPickerButton({ onEmojiSelect, theme = "light" }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelect = (emojiData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-gray-400 hover:text-yellow-500 transition p-1 rounded-full hover:bg-gray-100 text-base leading-none"
        title="Aggiungi emoji">
        😊
      </button>

      {open && (
        <>
          {/* Overlay — chiude cliccando fuori */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpen(false)}
          />

          {isMobile ? (
            /* MOBILE: bottom sheet */
            <div
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, background: "white", borderRadius: "16px 16px 0 0", boxShadow: "0 -4px 20px rgba(0,0,0,0.15)" }}>
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
          ) : (
            /* DESKTOP: apre in alto a sinistra rispetto al bottone */
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
    </>
  );
}

export default EmojiPickerButton;