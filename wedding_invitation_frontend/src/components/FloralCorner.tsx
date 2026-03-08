import React from "react";

type FloralCornerProps = {
  className?: string;
  title?: string;
};

/**
 * Decorative floral corner SVG in Ink theme colors.
 * Kept inline to avoid asset pipeline complexity with `output: "export"`.
 */
export function FloralCorner({ className, title }: FloralCornerProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 180"
      fill="none"
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id="leaf" x1="0" y1="0" x2="180" y2="180">
          <stop stopColor="#16A34A" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0F172A" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="petal" x1="0" y1="0" x2="180" y2="0">
          <stop stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="1" stopColor="#E2E8F0" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* stems */}
      <path
        d="M18 156C40 126 58 104 82 84C104 66 128 52 156 44"
        stroke="#0F172A"
        strokeOpacity="0.25"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M26 148C42 118 62 96 90 72C112 52 134 40 162 34"
        stroke="#16A34A"
        strokeOpacity="0.35"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* leaves */}
      <path
        d="M56 118C44 104 44 84 60 72C76 60 98 64 110 78C92 92 74 106 56 118Z"
        fill="url(#leaf)"
        opacity="0.85"
      />
      <path
        d="M96 86C92 70 100 54 116 48C132 42 150 52 154 70C132 70 114 78 96 86Z"
        fill="url(#leaf)"
        opacity="0.8"
      />
      <path
        d="M74 140C62 132 56 118 62 104C68 90 86 84 100 92C92 108 84 124 74 140Z"
        fill="url(#leaf)"
        opacity="0.72"
      />

      {/* flowers */}
      <g opacity="0.95">
        <circle cx="62" cy="78" r="9" fill="#16A34A" fillOpacity="0.25" />
        <path
          d="M62 60c6 8 12 14 0 18c-12-4-6-10 0-18Z"
          fill="url(#petal)"
        />
        <path
          d="M44 78c8-6 14-12 18 0c-4 12-10 6-18 0Z"
          fill="url(#petal)"
        />
        <path
          d="M62 96c-6-8-12-14 0-18c12 4 6 10 0 18Z"
          fill="url(#petal)"
        />
        <path
          d="M80 78c-8 6-14 12-18 0c4-12 10-6 18 0Z"
          fill="url(#petal)"
        />
        <circle cx="62" cy="78" r="4" fill="#0F172A" fillOpacity="0.45" />
      </g>

      <g opacity="0.9">
        <circle cx="132" cy="54" r="8" fill="#16A34A" fillOpacity="0.22" />
        <path
          d="M132 38c6 7 10 12 0 16c-10-4-6-9 0-16Z"
          fill="url(#petal)"
        />
        <path
          d="M116 54c7-6 12-10 16 0c-4 10-9 6-16 0Z"
          fill="url(#petal)"
        />
        <path
          d="M132 70c-6-7-10-12 0-16c10 4 6 9 0 16Z"
          fill="url(#petal)"
        />
        <path
          d="M148 54c-7 6-12 10-16 0c4-10 9-6 16 0Z"
          fill="url(#petal)"
        />
        <circle cx="132" cy="54" r="3.5" fill="#0F172A" fillOpacity="0.45" />
      </g>
    </svg>
  );
}
