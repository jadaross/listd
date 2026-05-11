"use client";

export function Wordmark({
  size = 56,
  color,
  stopColor,
  className,
}: {
  size?: number;
  color?: string;
  stopColor?: string;
  className?: string;
}) {
  return (
    <span
      className={`font-serif italic leading-none tracking-tight ${className ?? ""}`}
      style={{ fontSize: size, color: color ?? "var(--color-app-text)" }}
    >
      wattle
      <span style={{ color: stopColor ?? "var(--color-brand-scarlet)" }}>.</span>
    </span>
  );
}
