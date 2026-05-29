"use client";

export function DemandBars({ bars, accent }: { bars: number[]; accent: string }) {
  const max = Math.max(...bars, 1);
  return (
    <div className="flex gap-1 items-end h-[26px]">
      {bars.map((b, i) => (
        <div
          key={i}
          className="w-[7px] rounded-[2px]"
          style={{
            height: `${(b / max) * 100}%`,
            minHeight: 4,
            background: i === bars.length - 1 ? accent : "var(--color-app-line)",
          }}
        />
      ))}
    </div>
  );
}
