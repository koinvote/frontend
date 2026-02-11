import { useNavigate } from "react-router";

/**
 * Check if there is a previous SPA navigation entry.
 * React Router stores `idx` in history.state — idx > 0 means
 * the user has navigated within the app and `navigate(-1)` is safe.
 */
function hasSpaHistory(): boolean {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  return typeof idx === "number" && idx > 0;
}

export function useBackOrFallback(fallbackPath: string) {
  const navigate = useNavigate();

  const goBack = () => {
    if (hasSpaHistory()) {
      navigate(-1);
      return;
    }
    navigate(fallbackPath, { replace: true });
  };

  return goBack;
}

export function useBackIfInternal(fallbackPath: string) {
  const navigate = useNavigate();

  const goBack = () => {
    if (hasSpaHistory()) {
      navigate(-1);
      return;
    }
    navigate(fallbackPath, { replace: true });
  };

  return goBack;
}
