import { useEffect, useRef } from "react";

const MENTION_REGEX = /(#\w+|@[\w.]+)/g;

function highlight(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")
    .replace(MENTION_REGEX, '<span style="color:#3b82f6;font-weight:500">$1</span>');
}

/**
 * Textarea con @mention e #hashtag evidenziati in blu.
 * - textarea reale (valore/eventi standard, caret visibile)
 * - div overlay pointer-events:none che mostra il testo colorato
 * Il valore rimane sempre stringa pura — nessun HTML nel value.
 */
function MentionTextarea({ value, onChange, placeholder, rows = 1, disabled, className = "", textareaRef }) {
  const overlayRef = useRef(null);
  const localRef = useRef(null);
  const ref = textareaRef || localRef;

  // Sincronizza scroll overlay con textarea
  const syncScroll = () => {
    if (ref.current && overlayRef.current) {
      overlayRef.current.scrollTop = ref.current.scrollTop;
    }
  };

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.innerHTML = highlight(value) || '<span style="opacity:0">|</span>';
    }
  }, [value]);

  return (
    <div className="relative w-full" style={{ minHeight: "1.5rem" }}>
      {/* Overlay colorato — not interactive */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none text-sm py-0.5 whitespace-pre-wrap break-words overflow-hidden ${className}`}
        style={{
          fontFamily: "inherit",
          fontSize: "inherit",
          lineHeight: "inherit",
          letterSpacing: "inherit",
          padding: "2px 0",
          wordBreak: "break-word",
        }}
      />
      {/* Textarea trasparente sopra — il caret è visibile, il testo no */}
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        style={{
          resize: "none",
          caretColor: "#111827",
          color: "transparent",
          background: "transparent",
          position: "relative",
        }}
        className={`w-full outline-none text-sm py-0.5 bg-transparent ${className}`}
      />
    </div>
  );
}

export default MentionTextarea;