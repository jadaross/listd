export function StarIcon({ size = 12, fill = "currentColor", className = "" }: { size?: number; fill?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M8 1.5l1.95 4.1 4.55.55-3.35 3.1.85 4.5L8 11.6l-4 2.15.85-4.5L1.5 6.15l4.55-.55L8 1.5z"
        fill={fill}
      />
    </svg>
  );
}
