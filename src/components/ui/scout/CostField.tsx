"use client";

const QUICK_COSTS = [5, 10, 15, 25] as const;

export function CostField({
  cost,
  setCost,
}: {
  cost: string;
  setCost: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 bg-app-bg border border-app-line rounded-xl px-3.5 py-1">
        <span className="text-[22px] font-semibold text-app-muted">£</span>
        <input
          inputMode="decimal"
          value={cost}
          onChange={(e) => setCost(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0"
          aria-label="Asking price"
          className="flex-1 bg-transparent outline-none border-none text-[28px] font-semibold text-app-text py-2 w-full"
        />
      </div>
      <div className="flex gap-2">
        {QUICK_COSTS.map((c) => {
          const active = String(c) === String(cost);
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCost(String(c))}
              className={`flex-1 py-2 rounded-[9px] text-[13px] font-semibold ${
                active
                  ? "bg-app-accent text-white border-none"
                  : "bg-app-bg text-app-text border border-app-line"
              }`}
            >
              £{c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
