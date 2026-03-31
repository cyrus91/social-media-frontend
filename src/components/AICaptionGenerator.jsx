import { useState } from "react";
import { useAI } from "../hooks/useAI";
import { aiService } from "../services/aiService";

function AICaptionGenerator({ onCaptionGenerated, imageUrls = [] }) {
  const { generateCaption } = useAI();
  const [tone, setTone] = useState("friendly");
  const [suggestion, setSuggestion] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [loading, setLoading] = useState(false);

  const tones = [
    { value: "friendly", label: "Amichevole", emoji: "😊" },
    { value: "professional", label: "Professionale", emoji: "💼" },
    { value: "funny", label: "Divertente", emoji: "😄" },
    { value: "inspirational", label: "Ispirazionale", emoji: "✨" },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let caption;
      if (imageUrls && imageUrls.length > 0) {
        const res = await aiService.generateCaptionVision(imageUrls, tone, "");
        caption = res.suggestion || res;
      } else {
        caption = await generateCaption("", [], tone);
      }
      if (caption) {
        setSuggestion(caption);
        setShowSuggestion(true);
      }
    } catch (e) {
      console.error("Errore caption AI:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUse = () => {
    onCaptionGenerated(suggestion);
    setShowSuggestion(false);
    setSuggestion("");
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-5 h-5 text-purple-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
        <h3 className="font-semibold text-gray-900">Genera Caption con AI</h3>
      </div>

      {/* Tone Selector */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scegli il tono:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {tones.map((t) => (
            <button
              type="button"
              key={t.value}
              onClick={() => setTone(t.value)}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tone === t.value
                  ? "bg-purple-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-purple-100"
              }`}>
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Generazione in corso...</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <span>Genera Caption</span>
          </>
        )}
      </button>

      {/* Suggestion Display */}
      {showSuggestion && (
        <div className="mt-4 animate-fade-in">
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <p className="text-gray-800 mb-3">{suggestion}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUse}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                ✓ Usa questa caption
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Rigenera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AICaptionGenerator;