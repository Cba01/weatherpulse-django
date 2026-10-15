import { useEffect, useState } from "react";

/** Returns `value` only after it has stopped changing for `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    // Every new keystroke clears the pending timer and starts over.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
