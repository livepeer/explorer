import { useEffect, useState } from "react";

/**
 * Uses window.matchMedia to track a CSS media query.
 * Only fires when the breakpoint threshold is crossed,
 * unlike useWindowSize which fires on every resize pixel.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** Matches Stitches @bp3: (min-width: 1200px) */
export const useIsDesktop = () => useMediaQuery("(min-width: 1200px)");

/** Matches Stitches @bp2: (min-width: 900px) */
export const useIsTablet = () => useMediaQuery("(min-width: 900px)");
