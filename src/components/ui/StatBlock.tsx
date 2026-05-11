export function StatBlock({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div
        className={`uppercase text-[10px] font-medium tracking-[0.08em] ${
          dark ? "text-white/75" : "text-app-muted"
        }`}
      >
        {label}
      </div>
      <div
        className={`text-[14px] font-semibold tabular-nums ${
          dark ? "text-white" : "text-app-text"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
