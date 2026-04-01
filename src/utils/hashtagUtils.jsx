import { Link } from "react-router-dom";

export const renderTextWithHashtags = (text, navigate) => {
  if (!text) return null;
  const parts = text.split(/(#\w+|@[\w.]+)/g);
  return parts.map((part, i) => {
    if (part.match(/^#\w+$/)) {
      const tag = part.slice(1);
      return (
        <span key={i}
          onClick={e => { e.stopPropagation(); navigate(`/hashtag/${tag}`); }}
          style={{ color: "#0891b2", fontWeight: 600, cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
          onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
          {part}
        </span>
      );
    }
    if (part.match(/^@[\w.]+$/)) {
      return (
        <Link key={i} to={`/profile/${part.slice(1)}`}
          onClick={e => e.stopPropagation()}
          style={{ color: "#7c3aed", fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
          onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}>
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
};