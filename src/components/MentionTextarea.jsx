import { forwardRef } from "react";

/**
 * Textarea semplice con supporto @mention.
 * Le mention diventano blu nel post/commento pubblicato.
 * Il highlighting live nella textarea è rimosso per evitare
 * problemi con dangerouslySetInnerHTML che inquina il value.
 */
const MentionTextarea = forwardRef(function MentionTextarea(
  { value, onChange, placeholder, rows = 1, disabled, className = "", textareaRef },
  _ref
) {
  const ref = textareaRef || _ref;

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      style={{ resize: "none" }}
      className={`outline-none bg-transparent text-sm py-0.5 ${className}`}
    />
  );
});

export default MentionTextarea;