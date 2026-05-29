import type { ScoutMarket, ScoutResult, Verdict } from "@/lib/types";

export interface VerdictMeta {
  color: string;
  label: string;
  sub: string;
}

export function verdictMeta(v: Verdict): VerdictMeta {
  if (v === "worth")
    return {
      color: "var(--color-verdict-worth)",
      label: "Worth it",
      sub: "Healthy margin and steady demand — grab it.",
    };
  if (v === "maybe")
    return {
      color: "var(--color-verdict-maybe)",
      label: "Maybe",
      sub: "Thin margin. Depends what they’re asking.",
    };
  return {
    color: "var(--color-verdict-skip)",
    label: "Skip it",
    sub: "Not enough room to profit at that price.",
  };
}

export interface DerivedScout {
  range: [number, number];
  mid: number;
  hasCost: boolean;
  costNum: number;
  profit: number;
  profitLow: number;
  profitHigh: number;
  roi: number | null;
  verdict: Verdict;
}

/**
 * Verdict + margin maths. Mirrors the prototype's `deriveScout` exactly so the
 * web flow and the design source stay in lockstep.
 *
 * Why a tagAdded fallback verdict: when the user hasn't typed an asking price,
 * we still want a sensible default — high confidence reads as "worth it",
 * otherwise "maybe".
 */
export function deriveScout(input: {
  market: ScoutMarket;
  cost: string;
  confidenceLevel: 1 | 2 | 3;
}): DerivedScout {
  const { market, cost, confidenceLevel } = input;
  const range = market.range;
  const mid = Math.round((range[0] + range[1]) / 2);
  const parsed = parseFloat(cost);
  const hasCost = cost !== "" && cost != null && !Number.isNaN(parsed);
  const costNum = hasCost ? parsed : 0;
  const profit = mid - costNum;
  const profitLow = range[0] - costNum;
  const profitHigh = range[1] - costNum;
  const roi = hasCost && costNum > 0 ? Math.round((profit / costNum) * 100) : null;

  let verdict: Verdict;
  if (hasCost) {
    verdict = profit >= 25 ? "worth" : profit >= 10 ? "maybe" : "skip";
  } else {
    verdict = confidenceLevel >= 3 ? "worth" : "maybe";
  }

  return { range, mid, hasCost, costNum, profit, profitLow, profitHigh, roi, verdict };
}

export function confidenceLabel(level: 1 | 2 | 3): "Low" | "Med" | "High" {
  if (level === 3) return "High";
  if (level === 2) return "Med";
  return "Low";
}

export function activeGuess(result: ScoutResult): string {
  return result.confidence_level >= 3 ? result.guess.guess_tight : result.guess.guess_short;
}
