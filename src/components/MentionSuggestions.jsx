import { useEffect, useState } from "react";

/**
 * Dropdown @mention con position:fixed — non viene clippato
 * da overflow/border-radius né sovrappone la navbar.
 */
function MentionSuggestions({ suggestions, onSelect, visible, anchorRef }) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (visible && anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 224),
      });
    }
  }, [visible, anchorRef]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: 9999,
      }}
      className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
      {suggestions.map((user) => (
        <button
          key={user.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(user.username);
          }}
          className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 transition text-left">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.username?.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="text-sm font-semibold text-gray-800 truncate">@{user.username}</p>
        </button>
      ))}
    </div>
  );
}

export default MentionSuggestions;