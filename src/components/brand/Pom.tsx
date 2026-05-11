"use client";

import { useMemo } from "react";

type PomProps = {
  size?: number;
  count?: number;
  core?: string;
  fila?: string;
  tip?: string;
  stroke?: number;
  innerScale?: number;
  outerScale?: number;
  tipScale?: number;
  outline?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function Pom({
  size = 120,
  count = 22,
  core = "#c8321a",
  fila = "#e25a2b",
  tip = "#e8b547",
  stroke,
  innerScale = 0.16,
  outerScale = 0.43,
  tipScale = 0.05,
  outline = false,
  className,
  style,
}: PomProps) {
  const strokeW = stroke ?? Math.max(1, size * 0.011);
  const filaments = useMemo(() => {
    const c = size / 2;
    const innerR = size * innerScale;
    const outerR = size * outerScale;
    const out = [] as { x1: number; y1: number; x2: number; y2: number }[];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      out.push({
        x1: c + Math.cos(a) * innerR,
        y1: c + Math.sin(a) * innerR,
        x2: c + Math.cos(a) * outerR,
        y2: c + Math.sin(a) * outerR,
      });
    }
    return out;
  }, [size, count, innerScale, outerScale]);

  const c = size / 2;
  const innerR = size * innerScale;
  const tipR = size * tipScale;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      style={{ display: "block", overflow: "visible", ...style }}
      aria-hidden
    >
      {filaments.map((f, i) => (
        <line
          key={`l${i}`}
          x1={f.x1}
          y1={f.y1}
          x2={f.x2}
          y2={f.y2}
          stroke={outline ? core : fila}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
      ))}
      {filaments.map((f, i) => (
        <circle key={`t${i}`} cx={f.x2} cy={f.y2} r={tipR} fill={tip} />
      ))}
      {outline ? (
        <circle cx={c} cy={c} r={innerR} fill="none" stroke={core} strokeWidth={strokeW * 1.2} />
      ) : (
        <circle cx={c} cy={c} r={innerR} fill={core} />
      )}
    </svg>
  );
}
