import { Link } from "react-router-dom";

/**
 * Renderizza testo con #hashtag e @mention come elementi React cliccabili.
 * Uso: {renderTextWithHashtags(post.content, navigate)}
 */
export const renderTextWithHashtags = (text, navigate) => {
  if (!text) return null;

  // Split su hashtag E mention
  const parts = text.split(/(#\w+|@[\w.]+)/g);

  return parts.map((part, index) => {
    if (part.match(/^#\w+$/)) {
      const tag = part.slice(1);
      return (
        <span key={index}
          onClick={(e) => { e.stopPropagation(); navigate(`/hashtag/${tag}`); }}
          className="text-blue-500 hover:text-blue-600 hover:underline cursor-pointer font-medium">
          {part}
        </span>
      );
    }
    if (part.match(/^@[\w.]+$/)) {
      const username = part.slice(1);
      return (
        <Link key={index} to={`/profile/${username}`}
          onClick={(e) => e.stopPropagation()}
          className="text-blue-500 hover:text-blue-600 hover:underline font-medium">
          {part}
        </Link>
      );
    }
    return <span key={index}>{part}</span>;
  });
};