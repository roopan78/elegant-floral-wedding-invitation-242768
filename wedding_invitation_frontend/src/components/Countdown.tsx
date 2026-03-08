"use client";

import React, { useEffect, useMemo, useState } from "react";

function clampNonNegative(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function diffParts(targetMs: number, nowMs: number) {
  const diff = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return { diff, days, hours, minutes, seconds };
}

type CountdownProps = {
  isoDateTime: string; // ISO string in local timezone or with offset
  label?: string;
};

/**
 * Live countdown timer to the event.
 * Uses polite aria-live updates and avoids overly frequent announcements by updating every second.
 */
export function Countdown({ isoDateTime, label = "Countdown" }: CountdownProps) {
  const targetMs = useMemo(() => Date.parse(isoDateTime), [isoDateTime]);
  const [now, setNow] = useState(() => Date.now());
  const parts = useMemo(() => diffParts(targetMs, now), [targetMs, now]);

  useEffect(() => {
    if (!Number.isFinite(targetMs)) return;

    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  const done = parts.diff <= 0;

  return (
    <div aria-label={label}>
      <div className="countdown" role="group" aria-label="Time remaining">
        <div className="countBox">
          <div className="countNum">{clampNonNegative(parts.days)}</div>
          <div className="countLabel">Days</div>
        </div>
        <div className="countBox">
          <div className="countNum">{clampNonNegative(parts.hours)}</div>
          <div className="countLabel">Hours</div>
        </div>
        <div className="countBox">
          <div className="countNum">{clampNonNegative(parts.minutes)}</div>
          <div className="countLabel">Minutes</div>
        </div>
        <div className="countBox">
          <div className="countNum">{clampNonNegative(parts.seconds)}</div>
          <div className="countLabel">Seconds</div>
        </div>
      </div>

      <p className="smallNote" aria-live="polite">
        {done
          ? "Today is the day. We can’t wait to celebrate with you."
          : `Counting down to ${new Date(targetMs).toLocaleString()}.`}
      </p>
    </div>
  );
}
