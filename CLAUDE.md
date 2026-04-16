# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Production build
npm run lint       # ESLint check
npm run preview    # Preview production build locally
```

No test runner is configured in this project.

## Environment Variables

Copy `.env.example` to `.env` and set:

```
VITE_API_URL=http://localhost:8080/api          # REST API base URL
VITE_API_BASE_URL=http://localhost:8080         # WebSocket base (without /api)
```

The WebSocket hook (`useMessagingWebSocket`) derives the WS URL by stripping `/api` from `VITE_API_BASE_URL`. If only `VITE_API_URL` is set, the hook falls back to the production Koyeb URL.

## Architecture Overview

### Layer Structure

```
src/
  pages/        # Route-level components (one per page/route)
  components/   # Reusable UI components
  services/     # Domain API modules — all built on the central api.js
  store/        # Zustand global state (auth, messaging, theme)
  hooks/        # Custom React hooks
  utils/        # Pure utility functions
```

### API Layer (`src/services/api.js`)

Central Axios instance with two interceptors:
- **Request**: Attaches JWT from `localStorage.getItem("token")` as `Authorization: Bearer`.
- **Response**: Handles 401 with automatic token refresh (queues concurrent requests during refresh, retries after). On refresh failure or 403 "ban" response, calls `forceLogout()` which clears auth state, shows a toast, and redirects to `/login`.

All domain services (`postService`, `userService`, `commentService`, etc.) import this `api` instance — never create a separate Axios instance.

### State Management (`src/store/`)

Three Zustand stores:
- **`authStore`**: User identity + JWT tokens, synced to `localStorage`. Exposes `login`, `logout`, `updateUser`, and `loginWithTokens` (for OAuth2 callback flow).
- **`messagingStore`**: Conversation list, unread counts, online status, typing indicators. Updated by the WebSocket hook.
- **`themeStore`**: Dark/light theme toggle. Applies `data-theme` attribute on `<html>`. Initial value from `localStorage` or OS preference.

### Real-time Messaging (`src/hooks/useMessagingWebSocket.js`)

Single STOMP-over-SockJS connection initialized globally in `AppInner`. Subscribes to per-user queues:
- `/queue/messages/{userId}` — incoming messages
- `/queue/read-receipt/{userId}` — read receipts
- `/topic/online-status` — online/offline presence
- `/queue/typing/{userId}` — typing indicators
- `/queue/message-deleted/{userId}`, `/queue/reaction/{userId}`, `/queue/disappearing/{userId}`

`ChatPage` registers an `incomingMessageHandler` via `setIncomingMessageHandler()` to receive events when it's active. Tab-blink, browser notifications, and audio cues are triggered when the tab is in the background.

`sendTypingEvent(conversationId, isTyping)` is exported for `ChatPage` to publish typing events via the shared STOMP client.

### Routing & Guards

- `ProtectedRoute` — redirects to `/login` if not authenticated; also redirects banned users (`user.banned === true`) to `/login?banned=1`.
- `AdminRoute` — similar guard for admin-only pages.
- `OAuth2CallbackPage` — handles the Google/OAuth2 redirect, extracts tokens from URL params, calls `loginWithTokens`.

### AI Features

`src/services/aiService.js` + `src/hooks/useAI.js` wrap backend AI endpoints for:
- Caption generation
- Text improvement
- Reply suggestion
- Hashtag suggestions

Used in `AICaptionGenerator`, `AIHashtagSuggester`, and `CommentForm`.

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite` plugin). Theme CSS variables are set on `[data-theme="dark"]` / `[data-theme="light"]` selectors using the `--nx-*` prefix (e.g. `--nx-grad-btn`, `--nx-radius`). Toggle is managed by `themeStore`.

### Notification Pattern for Modals

`useRef` is used to track whether an `useEffect` is running for the first time to prevent firing on mount in `ReportModal` and `EditProfileModal`. This avoids infinite loops when effects depend on state that those effects also update.
