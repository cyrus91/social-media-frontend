import { Link } from "react-router-dom";

/**
 * Renderizza testo con @mention e #hashtag come link cliccabili.
 * Usato in CommentSection per il testo dei commenti.
 */
export function renderTextWithMentions(text) {
  if (!text) return null;
  const parts = text.split(/(#\w+|@[\w.]+)/g);
  return parts.map((part, i) => {
    if (part.match(/^@[\w.]+$/)) {
      return (
        <Link key={i} to={`/profile/${part.slice(1)}`}
          className="text-blue-500 hover:underline font-medium"
          onClick={e => e.stopPropagation()}>
          {part}
        </Link>
      );
    }
    if (part.match(/^#\w+$/)) {
      return (
        <span key={i} className="text-blue-500 hover:underline cursor-pointer font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}