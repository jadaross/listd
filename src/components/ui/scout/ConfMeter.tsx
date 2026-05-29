"use client";

export function ConfMeter({ level, accent }: { level: 1 | 2 | 3; accent: string }) {
  return (
    <div className="flex gap-[3px] items-center">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[14px] h-[5px] rounded-[3px]"
          style={{ background: i <= level ? accent : "var(--color-app-line)" }}
        />
      ))}
    </div>
  );
}
