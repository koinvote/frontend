import { useEffect } from "react";
import { useMatches } from "react-router";

type RouteHandle = { title?: string | null };

export function TitleManager() {
  const matches = useMatches();

  useEffect(() => {
    const handle = [...matches]
      .reverse()
      .map((m) => m.handle as RouteHandle | undefined)
      .find((h) => h?.title !== undefined);

    // Only set title when a non-null title is found.
    // Null means the page component will set its own title (e.g. event detail).
    if (handle?.title) {
      document.title = handle.title;
    }
  }, [matches]);

  return null;
}
