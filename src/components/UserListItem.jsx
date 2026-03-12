import { Link } from "react-router-dom";

function UserListItem({ user, subtitle, showFollowButton = false, onFollowClick }) {
  return (
    <Link
      to={`/profile/${user.username}`}
      className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
      
      {/* Avatar + Info */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Avatar */}
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user.username?.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Username + Subtitle */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">
            {user.username}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Follow Button (opzionale) */}
      {showFollowButton && onFollowClick && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onFollowClick(user.id);
          }}
          className="ml-3 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition">
          Segui
        </button>
      )}
    </Link>
  );
}

export default UserListItem;