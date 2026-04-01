import { Link } from "react-router-dom";

export function renderTextWithMentions(text) {
  if (!text) return null;
  const parts = text.split(/(#\w+|@[\w.]+)/g);
  return parts.map((part, i) => {
    if (part.match(/^@[\w.]+$/)) {
      return (
        <Link key={i} to={`/profile/${part.slice(1)}`}
          style={{ color: "#7c3aed", fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
          onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
          onClick={e => e.stopPropagation()}>
          {part}
        </Link>
      );
    }
    if (part.match(/^#\w+$/)) {
      return (
        <span key={i} style={{ color: "#0891b2", fontWeight: 600, cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
          onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
          {part}
        </span>
      );
    }
    return part;
  });
}