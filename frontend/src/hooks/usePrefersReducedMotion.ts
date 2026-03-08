"use client";

import { useEffect, useState } from "react";

// PUBLIC_INTERFACE
export function usePrefersReducedMotion(): boolean {
  /**
   * Returns true when the user has enabled reduced motion at the OS/browser level.
   */
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mql) return;

    const onChange = () => setReduced(!!mql.matches);
    onChange();

    // Safari < 14 uses addListener/removeListener
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    // Deprecated but required for older Safari; we avoid eslint disable directives
    // because the project doesn't include a deprecation lint rule plugin.
    (mql as MediaQueryList & { addListener?: (cb: () => void) => void }).addListener?.(
      onChange,
    );
    return () => {
      (
        mql as MediaQueryList & { removeListener?: (cb: () => void) => void }
      ).removeListener?.(onChange);
    };
  }, []);

  return reduced;
}
