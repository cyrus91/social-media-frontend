import { useEffect, useRef } from "react";

const MENTION_REGEX = /(#\w+|@[\w.]+)/g;

/**
 * Escape HTML speciale per evitare XSS nell'overlay.
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Genera HTML per l'overlay: @mention e #hashtag evidenziati in blu,
 * il resto del testo è trasparente (occupa spazio ma non si vede).
 */
function buildHighlightHtml(text) {
  if (!text) return '<span style="opacity:0">.</span>';

  // Splitta sulle newline prima, poi applica regex su ogni riga
  const lines = text.split("\n");
  return lines
    .map((line) => {
      if (!line) return "<br>";
      const escaped = escapeHtml(line);
      return escaped.replace(
        MENTION_REGEX,
        '<mark style="color:#3b82f6;background:transparent;font-weight:500">$1</mark>'
      );
    })
    .join("<br>");
}

/**
 * Stili condivisi tra textarea e overlay — DEVONO essere identici
 * per garantire allineamento pixel-perfect del testo.
 */
const SHARED_STYLES = {
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  letterSpacing: 'inherit',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  boxSizing: 'border-box',
  padding: '2px 0',
  border: 'none',
  margin: 0,
};

/**
 * MentionTextarea — textarea con @mention e #hashtag evidenziati in blu durante la digitazione.
 *
 * Tecnica "overlay mirror" (usata da Facebook, Twitter, Slack):
 * - Un div overlay renderizza il testo con le menzioni colorate
 * - Una textarea trasparente sovrapposta gestisce l'input e il caret
 * - Lo scroll è sincronizzato tra i due
 */
function MentionTextarea({ value, onChange, placeholder, rows = 1, disabled, className = "", textareaRef }) {
  const overlayRef = useRef(null);
  const localRef = useRef(null);
  const ref = textareaRef || localRef;

  // Sincronizza scroll dell'overlay con la textarea
  const syncScroll = () => {
    if (ref.current && overlayRef.current) {
      overlayRef.current.scrollTop = ref.current.scrollTop;
      overlayRef.current.scrollLeft = ref.current.scrollLeft;
    }
  };

  // Aggiorna HTML dell'overlay ogni volta che il valore cambia
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.innerHTML = buildHighlightHtml(value);
    }
  }, [value]);

  // Sincronizza scroll iniziale
  useEffect(() => {
    syncScroll();
  }, [value, syncScroll]);

  return (
    <div className={`mention-textarea-wrapper ${className}`} style={{ position: "relative", minHeight: "1.5em" }}>
      {/* Overlay colorato — non interattivo, sotto la textarea */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="mention-textarea-overlay"
        style={{
          ...SHARED_STYLES,
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          color: "transparent",
          overflow: "hidden",
          zIndex: 1,
        }}
      />
      {/* Textarea reale — testo trasparente, caret visibile */}
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onScroll={syncScroll}
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
          color: "transparent",
          caretColor: "#111827",
          background: "transparent",
          outline: "none",
          zIndex: 2,
        }}
      />
    </div>
  );
}

export default MentionTextarea;