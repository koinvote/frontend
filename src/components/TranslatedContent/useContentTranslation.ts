import { useCallback, useState } from "react";

/**
 * Per-content toggle between a machine translation and the exact canonical
 * original. Purely local component state, by design: it never touches the
 * global language, koinvote_locale / PREFERRED_LANGUAGE storage, or the
 * network, and it is not remembered anywhere once the component unmounts.
 */
export function useContentTranslation(hasTranslation: boolean) {
  const [showOriginal, setShowOriginal] = useState(false);
  const toggle = useCallback(() => setShowOriginal((v) => !v), []);
  return {
    hasTranslation,
    /** True when the machine translation is what should be rendered now. */
    showingTranslation: hasTranslation && !showOriginal,
    toggle,
  };
}
