import { useRef, useEffect } from "react";

/**
 * Textarea con @mention evidenziate in blu.
 * Tecnica: textarea trasparente sopra un div mirror con HTML colorato.
 */
function MentionTextarea({ value, onChange, placeholder, rows = 1, disabled, className = "", textareaRef: externalRef }) {
  const internalRef = useRef(null);
  const mirrorRef = useRef(null);
  const ref = externalRef || internalRef;

  // Sincronizza altezza mirror con textarea
  const syncHeight = () => {
    if (ref.current && mirrorRef.current) {
      mirrorRef.current.style.height = ref.current.style.height || "auto";
    }
  };

  useEffect(() => { syncHeight(); }, [value]);

  // Converti testo in HTML con mention blu
  const renderHighlighted = (text) => {
    if (!text) return "&nbsp;";
    // Escape HTML
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // Colora @mention e #hashtag
    return escaped
      .replace(/(@[\w.]+)/g, '<span style="color:#3b82f6;font-weight:500">$1</span>')
      .replace(/(#\w+)/g, '<span style="color:#3b82f6;font-weight:500">$1</span>')
      // Preserva newlines
      .replace(/\n/g, "<br/>");
  };

  return (
    <div className="relative w-full">
      {/* Mirror div — testo colorato, non interattivo */}
      <div
        ref={mirrorRef}
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none whitespace-pre-wrap break-words text-sm px-0 py-0.5 ${className}`}
        style={{
          color: "transparent",
          fontFamily: "inherit",
          fontSize: "inherit",
          lineHeight: "inherit",
          letterSpacing: "inherit",
          wordBreak: "break-word",
          overflowWrap: "break-word",
          overflow: "hidden",
        }}
        dangerouslySetInnerHTML={{ __html: renderHighlighted(value) }}
      />
      {/* Textarea trasparente sopra — riceve l'input */}
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        style={{ resize: "none", caretColor: "#111827", color: "transparent" }}
        className={`relative w-full outline-none bg-transparent py-0.5 text-sm ${className}`}
        // Il testo è "invisibile" (transparent) ma il caret e la selezione sono visibili
        // Il mirror div sotto mostra il testo colorato
      />
      {/* Testo visibile NON trasparente — sovrapposto al mirror */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none whitespace-pre-wrap break-words text-sm py-0.5 ${className}`}
        style={{
          fontFamily: "inherit",
          fontSize: "inherit",
          lineHeight: "inherit",
          overflow: "hidden",
          wordBreak: "break-word",
        }}
        dangerouslySetInnerHTML={{ __html: renderHighlighted(value) }}
      />
    </div>
  );
}

export default MentionTextarea;