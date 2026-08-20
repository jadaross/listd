import type { PhotoRef } from "@/lib/mock-data";

/**
 * Striped placeholder tile — port of ios/Wattle/Components/PhotoTile.swift.
 * Used both as a stand-in for uploaded photos and for history thumbnails.
 */
export function PhotoTile({
  photo,
  rounded = 12,
  showLabel = true,
  className = "",
}: {
  photo: PhotoRef;
  rounded?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const bg = `hsl(${photo.hue}, 18%, 78%)`;
  const fg = `hsl(${photo.hue}, 22%, 56%)`;
  const labelTone = `hsl(${photo.hue}, 30%, 28%)`;
  const patternId = `stripes-${photo.id}`;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: bg, borderRadius: rounded }}
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0" aria-hidden>
        <defs>
          <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke={fg} strokeOpacity="0.25" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#${patternId})`} />
      </svg>
      {showLabel && (
        <div
          className="absolute left-2 bottom-1.5 font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded bg-white/55"
          style={{ color: labelTone }}
        >
          {photo.label}
        </div>
      )}
    </div>
  );
}
