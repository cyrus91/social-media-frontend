import { useState, useRef, useCallback, useEffect } from "react";
import { searchUsers } from "../services/userService";

/**
 * Hook riusabile per gestire @mention in textarea/input.
 * Restituisce props e stato da applicare all'input e al dropdown.
 */
export function useMentionInput(value, onChange) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const searchTimer = useRef(null);

  const handleChange = useCallback(async (e) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(text);

    // Trova se il cursore è dopo una @
    const textBeforeCursor = text.slice(0, cursor);
    const match = textBeforeCursor.match(/@([\w.]*)$/);

    if (match) {
      const query = match[1];
      setMentionQuery(query);
      setMentionStart(cursor - match[0].length);

      // Debounce ricerca
      clearTimeout(searchTimer.current);
      if (query.length >= 1) {
        searchTimer.current = setTimeout(async () => {
          try {
            const res = await searchUsers(query);
            if (res.success) {
              setSuggestions((res.data || []).slice(0, 5));
              setShowSuggestions(true);
            }
          } catch { /* silenzioso */ }
        }, 200);
      } else {
        setSuggestions([]);
        setShowSuggestions(true); // Mostra trending/recenti
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      setMentionStart(-1);
    }
  }, [onChange]);

  const selectMention = useCallback((username, inputRef) => {
    if (mentionStart < 0) return;
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + mentionQuery.length + 1); // +1 per @
    const newValue = `${before}@${username} ${after}`;
    onChange(newValue);
    setShowSuggestions(false);
    setSuggestions([]);
    setMentionStart(-1);

    // Sposta cursore dopo il mention
    setTimeout(() => {
      if (inputRef?.current) {
        const pos = before.length + username.length + 2; // @username + spazio
        inputRef.current.setSelectionRange(pos, pos);
        inputRef.current.focus();
      }
    }, 0);
  }, [value, mentionStart, mentionQuery, onChange]);

  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  // Chiudi con Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") setShowSuggestions(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return {
    handleChange,
    selectMention,
    suggestions,
    showSuggestions,
    closeSuggestions,
  };
}