"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type ParallaxBandProps = {
  id?: string;
  title: string;
  children: React.ReactNode;
  strength?: number; // pixels of max translate
};

/**
 * A lightweight, accessible parallax background band.
 * Uses a single scroll listener + requestAnimationFrame to update a CSS variable.
 */
export function ParallaxBand({
  id,
  title,
  children,
  strength = 22,
}: ParallaxBandProps) {
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const strengthClamped = useMemo(
    () => Math.max(0, Math.min(60, strength)),
    [strength],
  );

  useEffect(() => {
    if (reducedMotion) return;

    const el = rootRef.current;
    if (!el) return;

    const update = () => {
      rafRef.current = null;
      const rect = el.getBoundingClientRect();

      // Compute a gentle translate based on distance from center of viewport.
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const delta = (elementCenter - viewportCenter) / viewportCenter; // ~[-1,1]

      const y = Math.round(delta * strengthClamped);
      el.style.setProperty("--parallaxY", `${y}px`);
    };

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion, strengthClamped]);

  return (
    <section id={id} ref={rootRef} className="parallaxBand" aria-label={title}>
      <div className="parallaxBg" aria-hidden="true" />
      <div className="parallaxContent">{children}</div>
    </section>
  );
}
