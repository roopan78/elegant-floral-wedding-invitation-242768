"use client";

import { useEffect } from "react";

// PUBLIC_INTERFACE
export function useScrollProgress(): void {
  /**
   * Updates `--scroll-progress` on <html> with a normalized page scroll value.
   */
  useEffect(() => {
    const root = document.documentElement;
    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      const max = Math.max(root.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      root.style.setProperty("--scroll-progress", progress.toFixed(4));
    };

    const onScrollOrResize = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (rafId != null) window.cancelAnimationFrame(rafId);
      root.style.removeProperty("--scroll-progress");
    };
  }, []);
}
