"use client";

import type { Verdict } from "@/lib/types";
import { verdictMeta } from "@/lib/scout/derive";

export function VerdictHero({
  verdict,
  range,
  checking,
  hasCost,
  profit,
}: {
  verdict: Verdict;
  range: [number, number];
  checking: boolean;
  hasCost: boolean;
  profit: number;
}) {
  const vm = verdictMeta(verdict);
  return (
    <div
      className="relative overflow-hidden rounded-[22px] text-white"
      style={{
        background: vm.color,
        padding: "22px 22px 20px",
        boxShadow: `0 16px 40px color-mix(in srgb, ${vm.color} 20%, transparent)`,
      }}
    >
      <div
        className="absolute -top-10 -right-10 w-[150px] h-[150px] rounded-full"
        style={{ background: "rgba(255,255,255,0.1)" }}
      />
      <div className="relative">
        <div className="text-[11px] font-mono uppercase tracking-[0.12em] opacity-85">
          Verdict
        </div>
        <div className="font-serif text-[46px] leading-none tracking-tight mt-1">
          {vm.label}
        </div>
        <div className="text-[13.5px] opacity-90 mt-1.5 max-w-[280px] leading-snug">
          {vm.sub}
        </div>

        <div className="h-px bg-white/20 my-4" />
        <div className="flex justify-between items-end">
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] opacity-80">
              Resells for
            </div>
            <div className="text-[34px] font-bold tracking-tight">
              £{range[0]}–{range[1]}
              {checking && (
                <span className="ml-2 text-[12px] font-medium opacity-85">
                  re-checking…
                </span>
              )}
            </div>
          </div>
          {hasCost && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.08em] opacity-80">
                Est. profit
              </div>
              <div className="text-[26px] font-bold tracking-tight">
                {profit >= 0 ? "+" : "−"}£{Math.abs(Math.round(profit))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
