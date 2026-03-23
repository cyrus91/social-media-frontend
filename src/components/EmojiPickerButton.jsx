import { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";

function EmojiPickerButton({ onEmojiSelect, theme = "light" }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [pickerStyle, setPickerStyle] = useState({});
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const handleToggle = () => {
    if (!open && wrapperRef.current && !isMobile) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const pickerWidth = 300;
      const pickerHeight = 350;

      // Spazio sopra e sotto
      const spaceAbove = rect.top;
      // Spazio a destra e sinistra
      const spaceRight = window.innerWidth - rect.left;

      const style = {};

      // Verticale: apri sotto se non c'è spazio sopra
      if (spaceAbove >= pickerHeight + 16) {
        style.bottom = "calc(100% + 8px)";
      } else {
        style.top = "calc(100% + 8px)";
      }

      // Orizzontale: apri a destra se c'è spazio, altrimenti a sinistra
      if (spaceRight >= pickerWidth + 16) {
        style.left = 0;
      } else {
        style.right = 0;
      }

      setPickerStyle(style);
    }
    setOpen(!open);
  };

  const handleSelect = (emojiData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={handleToggle}
        className="text-gray-400 hover:text-yellow-500 transition p-1 rounded-full hover:bg-gray-100 text-base leading-none"
        title="Aggiungi emoji">
        😊
      </button>

      {open && (
        <>
          {isMobile ? (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.3)" }}
                onClick={() => setOpen(false)}
              />
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
            <div style={{
              position: "absolute",
              zIndex: 9999,
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              borderRadius: 12,
              overflow: "hidden",
              ...pickerStyle
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