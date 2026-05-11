export function Eyebrow({ children, mono = false, className = "" }: { children: React.ReactNode; mono?: boolean; className?: string }) {
  return (
    <div
      className={`uppercase ${mono ? "font-mono tracking-[0.1em] text-[11px]" : "tracking-[0.08em] text-[11px] font-semibold"} text-app-muted ${className}`}
    >
      {children}
    </div>
  );
}
