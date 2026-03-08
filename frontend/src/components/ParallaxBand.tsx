"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type ParallaxBandProps = {
  id?: string;
  title: string;
  children: React.ReactNode;
  strength?: number; // pixels of max translate
  className?: string;
  revealDelay?: number;
};

/**
 * Multi-layer parallax band with depth movement and glow variation.
 * Uses one scroll listener + requestAnimationFrame and keeps motion optional.
 */
export function ParallaxBand({
  id,
  title,
  children,
  strength = 22,
  className,
  revealDelay,
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

    const nearStrength = strengthClamped;
    const midStrength = Math.round(strengthClamped * 0.62);
    const farStrength = Math.round(strengthClamped * 0.36);

    const update = () => {
      rafRef.current = null;
      const rect = el.getBoundingClientRect();

      // Compute depth movement from element position relative to viewport center.
      const viewportHeight = Math.max(window.innerHeight, 1);
      const viewportCenter = viewportHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const deltaRaw = (elementCenter - viewportCenter) / viewportCenter;
      const delta = Math.max(-1.2, Math.min(1.2, deltaRaw));
      const proximity = 1 - Math.min(1, Math.abs(delta)); // stronger glow near center

      // Progress from entry to exit through viewport (0 -> 1).
      const progressRaw = (viewportHeight - rect.top) / (rect.height + viewportHeight);
      const progress = Math.max(0, Math.min(1, progressRaw));
      const driftX = Math.round((progress - 0.5) * 28);
      const tilt = (delta * 1.4).toFixed(2);

      el.style.setProperty("--parallaxYFar", `${Math.round(delta * farStrength)}px`);
      el.style.setProperty("--parallaxYMid", `${Math.round(delta * midStrength)}px`);
      el.style.setProperty("--parallaxYNear", `${Math.round(delta * nearStrength)}px`);
      el.style.setProperty("--parallaxDrift", `${driftX}px`);
      el.style.setProperty("--parallaxTilt", `${tilt}deg`);
      el.style.setProperty("--parallaxGlow", (0.35 + proximity * 0.45).toFixed(3));
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
    <section
      id={id}
      ref={rootRef}
      className={`parallaxBand revealUp ${className ?? ""}`.trim()}
      aria-label={title}
      data-reveal
      data-reveal-delay={revealDelay}
    >
      <div className="parallaxLayers" aria-hidden="true">
        <div className="parallaxLayer parallaxLayerFar" />
        <div className="parallaxLayer parallaxLayerMid" />
        <div className="parallaxLayer parallaxLayerNear" />
        <div className="parallaxSpark parallaxSparkOne" />
        <div className="parallaxSpark parallaxSparkTwo" />
      </div>
      <div className="parallaxContent">{children}</div>
    </section>
  );
}
