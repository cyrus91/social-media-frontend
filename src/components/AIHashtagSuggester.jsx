import { useState } from "react";
import { useAI } from "../hooks/useAI";

/**
 * Suggerisce hashtag basati sul contenuto del post.
 * Props:
 *   content: string — testo del post
 *   onHashtagsInsert: (text: string) => void — chiamata con gli hashtag da appendere al testo
 */
function AIHashtagSuggester({ content, onHashtagsInsert }) {
  const { loading, suggestHashtags } = useAI();
  const [hashtags, setHashtags] = useState([]);
  const [selected, setSelected] = useState([]);
  const [shown, setShown] = useState(false);

  const handleGenerate = async () => {
    if (!content.trim()) {
      return;
    }
    const result = await suggestHashtags(content);
    if (result && result.length > 0) {
      setHashtags(result);
      setSelected(result); // tutti selezionati di default
      setShown(true);
    }
  };

  const toggleHashtag = (tag) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleInsert = () => {
    if (selected.length === 0) return;
    const text = " " + selected.join(" ");
    onHashtagsInsert(text);
    setShown(false);
    setHashtags([]);
    setSelected([]);
  };

  return (
    <div>
      {/* Bottone trigger */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !content.trim()}
        className="flex items-center space-x-1 text-gray-400 hover:text-purple-500 transition p-1 rounded-full hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Suggerisci hashtag con AI">
        {loading ? (
          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        )}
      </button>

      {/* Panel hashtag suggeriti */}
      {shown && hashtags.length > 0 && (
        <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-xl">
          <p className="text-xs font-semibold text-purple-700 mb-2">✨ Hashtag suggeriti — seleziona quelli che vuoi:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {hashtags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleHashtag(tag)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                  selected.includes(tag)
                    ? "bg-purple-500 text-white"
                    : "bg-white text-purple-600 border border-purple-300"
                }`}>
                {tag}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleInsert}
              disabled={selected.length === 0}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-50">
              Aggiungi al testo
            </button>
            <button
              type="button"
              onClick={() => { setShown(false); setHashtags([]); setSelected([]); }}
              className="text-gray-400 hover:text-gray-600 text-xs transition">
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIHashtagSuggester;