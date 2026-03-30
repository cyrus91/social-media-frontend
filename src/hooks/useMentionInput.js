import { useState, useRef, useCallback, useEffect } from "react";
import { getFollowing } from "../services/followService";
import useAuthStore from "../store/authStore";

export function useMentionInput(value, onChange) {
  const currentUser = useAuthStore(state => state.user);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const followingCacheRef = useRef(null);
  const searchTimer = useRef(null);

  // Funzione normale (no useCallback) — solo uso interno, non passa come prop
  const loadFollowing = async (userId) => {
    if (followingCacheRef.current !== null) return followingCacheRef.current;
    try {
      const res = await getFollowing(userId);
      const list = (res.data || []).map(f => ({
        id: f.followedId,
        username: f.followedUsername,
        avatarUrl: f.followedAvatarUrl,
      }));
      followingCacheRef.current = list;
      return list;
    } catch { return []; }
  };

  const handleChange = useCallback(async (e) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(text);

    const textBeforeCursor = text.slice(0, cursor);
    const match = textBeforeCursor.match(/@([\w.]*)$/);

    if (match) {
      const query = match[1];
      setMentionQuery(query);
      setMentionStart(cursor - match[0].length);

      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(async () => {
        if (!currentUser?.id) return;
        const following = await loadFollowing(currentUser.id);
        const filtered = following.filter(u => {
          if (query !== "" && !u.username.toLowerCase().includes(query.toLowerCase())) return false;
          // Nascondi utenti già menzionati nel testo
          const alreadyIn = new RegExp(`@${u.username}\\b`, 'i').test(value);
          return !alreadyIn;
        }).slice(0, 5);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }, 150);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      setMentionStart(-1);
    }
  }, [onChange, currentUser, value]);

  const selectMention = useCallback((username, inputRef) => {
    if (mentionStart < 0) return;

    // Evita mention duplicata
    const alreadyMentioned = new RegExp(`@${username}\\b`, 'i').test(value);
    if (alreadyMentioned) {
      setShowSuggestions(false);
      setSuggestions([]);
      setMentionStart(-1);
      return;
    }

    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + mentionQuery.length + 1);
    const newValue = `${before}@${username} ${after}`;
    const cursorPos = before.length + username.length + 2; // @ + username + spazio

    onChange(newValue);
    setShowSuggestions(false);
    setSuggestions([]);
    setMentionStart(-1);

    // requestAnimationFrame garantisce che React abbia aggiornato il DOM prima di settare il cursore
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (inputRef?.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(cursorPos, cursorPos);
        }
      });
    });
  }, [value, mentionStart, mentionQuery, onChange]);

  const closeSuggestions = useCallback(() => setShowSuggestions(false), []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") setShowSuggestions(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return { handleChange, selectMention, suggestions, showSuggestions, closeSuggestions };
}