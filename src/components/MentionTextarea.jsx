import { useEffect, useRef, useState } from "react";

const MENTION_REGEX = /(#\w+|@[\w.]+)/g;

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHighlightHtml(text) {
  if (!text) return '<span style="opacity:0">.</span>';
  const lines = text.split("\n");
  return lines
    .map((line) => {
      if (!line) return "<br>";
      const escaped = escapeHtml(line);
      return escaped.replace(
        MENTION_REGEX,
        (match) => match.startsWith("#")
          ? `<mark style="color:#0891b2;background:transparent;font-weight:600">${match}</mark>`
          : `<mark style="color:#7c3aed;background:transparent;font-weight:600">${match}</mark>`
      );
    })
    .join("<br>");
}

const SHARED_STYLES = {
  fontFamily: "inherit",
  fontSize: "inherit",
  lineHeight: "inherit",
  letterSpacing: "inherit",
  wordBreak: "break-word",
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
  boxSizing: "border-box",
  padding: "2px 0",
  border: "none",
  margin: 0,
};

/**
 * MentionTextarea — overlay mirror approach.
 * Quando la textarea è in focus: overlay nascosto, testo visibile → selezione e caret normali.
 * Quando non in focus: overlay visibile con hashtag/mention colorati.
 */
function MentionTextarea({ value, onChange, placeholder, rows = 1, disabled, className = "", textareaRef }) {
  const overlayRef = useRef(null);
  const localRef = useRef(null);
  const ref = textareaRef || localRef;
  const [focused, setFocused] = useState(false);

  const syncScroll = () => {
    if (ref.current && overlayRef.current) {
      overlayRef.current.scrollTop = ref.current.scrollTop;
      overlayRef.current.scrollLeft = ref.current.scrollLeft;
    }
  };

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.innerHTML = buildHighlightHtml(value);
    }
  }, [value]);

  useEffect(() => { syncScroll(); }, [value]);

  return (
    <div className={`mention-textarea-wrapper ${className}`} style={{ position: "relative", minHeight: "1.5em" }}>
      {/* Overlay colorato — visibile solo quando la textarea NON è in focus */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="mention-textarea-overlay"
        style={{
          ...SHARED_STYLES,
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          color: "var(--nx-text)",
          overflow: "hidden",
          zIndex: 1,
          // Nascosto quando in focus → niente doppio testo né caret sfasato
          opacity: focused ? 0 : 1,
        }}
      />
      {/* Textarea — testo trasparente quando non in focus (mostra overlay),
          testo visibile quando in focus (selezione e caret corretti) */}
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="mention-textarea-input"
        style={{
          ...SHARED_STYLES,
          position: "relative",
          display: "block",
          width: "100%",
          resize: "none",
          // Testo visibile in focus, trasparente fuori focus
          color: focused ? "var(--nx-text)" : "transparent",
          WebkitTextFillColor: focused ? "var(--nx-text)" : "transparent",
          caretColor: "var(--nx-text)",
          background: "transparent",
          outline: "none",
          zIndex: 2,
        }}
      />
    </div>
  );
}

export default MentionTextarea;