"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// PUBLIC_INTERFACE
export function useScrollReveal(selector = "[data-reveal]"): void {
  /**
   * Reveals marked elements as they enter the viewport.
   * Adds `motion-animate` on <html> only when motion is allowed.
   */
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const root = document.documentElement;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));

    if (!nodes.length) return;

    if (reducedMotion) {
      root.classList.remove("motion-animate");
      for (const node of nodes) {
        node.classList.add("revealVisible");
        node.style.removeProperty("--reveal-delay");
      }
      return;
    }

    root.classList.add("motion-animate");

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const rawDelay = Number(node.dataset.revealDelay);
      const delay = Number.isFinite(rawDelay) ? Math.max(0, rawDelay) : (i % 6) * 70;
      node.style.setProperty("--reveal-delay", `${delay}ms`);
    }

    if (typeof IntersectionObserver === "undefined") {
      for (const node of nodes) node.classList.add("revealVisible");
      return () => {
        root.classList.remove("motion-animate");
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("revealVisible");
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    for (const node of nodes) observer.observe(node);

    return () => {
      observer.disconnect();
      root.classList.remove("motion-animate");
      for (const node of nodes) node.style.removeProperty("--reveal-delay");
    };
  }, [reducedMotion, selector]);
}
