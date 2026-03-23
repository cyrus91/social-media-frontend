import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";

/**
 * Bottone con emoji picker riusabile
 * Props:
 *   onEmojiSelect: (emoji) => void  — chiamata con l'emoji selezionata
 *   theme: "light" | "dark" (default "light")
 */
function EmojiPickerButton({ onEmojiSelect, theme = "light" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Chiudi cliccando fuori
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (emojiData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-gray-400 hover:text-yellow-500 transition p-1 rounded-full hover:bg-gray-100"
        title="Aggiungi emoji">
        😊
      </button>

      {open && (
        <div className="absolute bottom-10 left-0 z-50 shadow-xl rounded-xl overflow-hidden">
          <EmojiPicker
            onEmojiClick={handleSelect}
            theme={theme}
            width={300}
            height={380}
            searchPlaceholder="Cerca emoji..."
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
}

export default EmojiPickerButton;