/**
 * Renderizza il testo con gli hashtag come elementi React cliccabili.
 * Uso: {renderTextWithHashtags(post.content, navigate)}
 */
export const renderTextWithHashtags = (text, navigate) => {
  if (!text) return null;

  const parts = text.split(/(#\w+)/g);

  return parts.map((part, index) => {
    if (part.match(/^#\w+$/)) {
      const tag = part.slice(1); // rimuovi il #
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/hashtag/${tag}`);
          }}
          className="text-blue-500 hover:text-blue-600 hover:underline cursor-pointer font-medium">
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};