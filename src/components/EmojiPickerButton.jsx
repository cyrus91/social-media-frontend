import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";

function EmojiPickerButton({ onEmojiSelect, theme = "light" }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ bottom: true, left: true });
  const buttonRef = useRef(null);
  const ref = useRef(null);

  // Calcola la posizione ottimale in base allo spazio disponibile
  const calculatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const pickerWidth = Math.min(300, windowWidth - 16);
    const pickerHeight = 380;

    // Apri a sinistra se non c'è spazio a destra
    const openLeft = rect.left + pickerWidth > windowWidth - 8;
    // Apri in alto se non c'è spazio in basso
    const openTop = rect.bottom + pickerHeight > windowHeight - 8;

    setPosition({ bottom: openTop, left: !openLeft });
  };

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

  const handleOpen = () => {
    calculatePosition();
    setOpen(!open);
  };

  const handleSelect = (emojiData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  const isMobile = window.innerWidth < 640;
  const pickerWidth = isMobile ? Math.min(280, window.innerWidth - 32) : 300;

  // Classi di posizionamento dinamiche
  const positionClasses = [
    position.bottom ? "bottom-10" : "top-10",
    position.left ? "left-0" : "right-0",
  ].join(" ");

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className="text-gray-400 hover:text-yellow-500 transition p-1 rounded-full hover:bg-gray-100 text-lg"
        title="Aggiungi emoji">
        😊
      </button>

      {open && (
        <>
          {/* Overlay su mobile per chiudere toccando fuori */}
          {isMobile && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
          )}

          <div className={`absolute ${positionClasses} z-50 shadow-xl rounded-xl overflow-hidden`}>
            <EmojiPicker
              onEmojiClick={handleSelect}
              theme={theme}
              width={pickerWidth}
              height={isMobile ? 320 : 380}
              searchPlaceholder="Cerca emoji..."
              previewConfig={{ showPreview: false }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default EmojiPickerButton;