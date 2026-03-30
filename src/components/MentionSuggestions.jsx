/**
 * Dropdown autocomplete per le mention @utente.
 * Da posizionare in `relative` container sopra l'input.
 */
function MentionSuggestions({ suggestions, onSelect, visible }) {
  if (!visible || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
      {suggestions.map((user) => (
        <button
          key={user.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault(); // Evita blur sull'input
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
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">@{user.username}</p>
            {user.fullName && (
              <p className="text-xs text-gray-400 truncate">{user.fullName}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export default MentionSuggestions;