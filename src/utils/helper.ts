import { useRef, useCallback } from "react";

/**
 * Custom hook for debounced click functionality
 * Prevents multiple click actions within a specified time window
 *
 * @param clickFn - Function that performs the click action
 * @param delay - Debounce delay in milliseconds (default: 2000ms)
 * @returns A debounced click handler function
 *
 * @example
 * // For copy operations
 * const handleCopy = useDebouncedClick(async () => {
 *   await navigator.clipboard.writeText(text);
 *   showToast("success", "Copied!");
 * });
 *
 * @example
 * // For other click actions
 * const handleAction = useDebouncedClick(async () => {
 *   await performAction();
 *   showToast("success", "Action completed!");
 * });
 */
export function useDebouncedClick<
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends (...args: any[]) => Promise<void> | void
>(clickFn: T, delay: number = 2000) {
  const lastClickTimeRef = useRef<number>(0);

  const debouncedClick = useCallback(
    async (...args: Parameters<T>) => {
      // If the last argument is a React event, stop propagation
      const lastArg = args[args.length - 1];
      if (
        lastArg &&
        typeof lastArg === "object" &&
        "stopPropagation" in lastArg
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (lastArg as any).stopPropagation();
      }

      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;

      // If click was called within the delay window, ignore it
      if (timeSinceLastClick < delay) {
        return;
      }

      // Update last click time
      lastClickTimeRef.current = now;

      // Execute the click function
      await clickFn(...args);
    },
    [clickFn, delay]
  );

  return debouncedClick;
}
