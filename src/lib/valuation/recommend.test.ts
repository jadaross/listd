import { describe, expect, it } from "vitest";
import type { Confidence, Platform, PriceBand, Valuation } from "@/lib/types";
import { midpoint, recommend, score } from "./recommend";

function band(
  low: number,
  high: number,
  sell_likelihood: Confidence = "medium",
  confidence: Confidence = "medium"
): PriceBand {
  return {
    low,
    high,
    currency: "GBP",
    confidence,
    sell_likelihood,
    comparables: [{ title: "c", price: low, currency: "GBP", platform: "vinted" }],
    reasoning: `Listed at £${low}–£${high}.`,
  };
}

function valuation(perPlatform: Partial<Record<Platform, PriceBand>>): Valuation {
  return { perPlatform, query: "test item" };
}

describe("midpoint / score", () => {
  it("takes the middle of the band", () => {
    expect(midpoint(band(50, 80))).toBe(65);
  });

  it("rounds to whole pounds", () => {
    expect(midpoint(band(50, 81))).toBe(66);
  });

  it("weights a fast-selling band above a slow one at the same price", () => {
    expect(score(band(50, 80, "high"))).toBeGreaterThan(score(band(50, 80, "low")));
  });
});

describe("recommend — when it runs at all", () => {
  it("returns null for a single platform — nothing to choose between", () => {
    expect(recommend(valuation({ vinted: band(50, 80) }))).toBeNull();
  });

  it("returns null for an empty valuation", () => {
    expect(recommend(valuation({}))).toBeNull();
  });

  it("runs with two platforms", () => {
    expect(recommend(valuation({ vinted: band(50, 80), depop: band(60, 90) }))).not.toBeNull();
  });
});

describe("recommend — ranking", () => {
  it("prefers the higher band", () => {
    const result = recommend(valuation({ vinted: band(40, 60), depop: band(70, 90) }));
    expect(result!.platform).toBe("depop");
  });

  it("prefers the faster seller when prices match", () => {
    const result = recommend(
      valuation({ vinted: band(50, 80, "low"), depop: band(50, 80, "high") })
    );
    expect(result!.platform).toBe("depop");
  });

  it("lets a big price gap beat a likelihood edge", () => {
    const result = recommend(
      valuation({ vinted: band(100, 140, "low"), depop: band(40, 60, "high") })
    );
    expect(result!.platform).toBe("vinted");
  });

  it("does NOT simply pick the zero-fee platform", () => {
    // Vinted takes 0%, Depop 10%, eBay 13.25%. Ranking on net would always
    // return Vinted; ranking on band × likelihood must not.
    const result = recommend(
      valuation({ vinted: band(30, 40, "medium"), ebay: band(90, 110, "medium") })
    );
    expect(result!.platform).toBe("ebay");
  });

  it("breaks a dead tie by confidence", () => {
    const result = recommend(
      valuation({
        vinted: band(50, 80, "medium", "low"),
        depop: band(50, 80, "medium", "high"),
      })
    );
    expect(result!.platform).toBe("depop");
  });

  it("is stable when everything ties", () => {
    const a = recommend(valuation({ vinted: band(50, 80), depop: band(50, 80) }));
    const b = recommend(valuation({ vinted: band(50, 80), depop: band(50, 80) }));
    expect(a!.platform).toBe(b!.platform);
  });
});

describe("recommend — output", () => {
  it("lists at the midpoint of the winning band", () => {
    const result = recommend(valuation({ vinted: band(50, 90), depop: band(20, 30) }));
    expect(result!.listAt).toBe(70);
  });

  it("applies the fee after ranking, for the net figure", () => {
    const result = recommend(valuation({ depop: band(100, 100), vinted: band(20, 30) }));
    expect(result!.platform).toBe("depop");
    expect(result!.listAt).toBe(100);
    expect(result!.net).toBe(90); // Depop takes 10%
  });

  it("takes nothing off on Vinted", () => {
    const result = recommend(valuation({ vinted: band(100, 100), depop: band(20, 30) }));
    expect(result!.net).toBe(100);
  });

  it("lists the runners-up with their own numbers", () => {
    const result = recommend(
      valuation({ vinted: band(90, 110), depop: band(50, 70), ebay: band(30, 50) })
    );
    expect(result!.runnersUp).toHaveLength(2);
    expect(result!.runnersUp[0].platform).toBe("depop");
    expect(result!.runnersUp[0].listAt).toBe(60);
  });

  it("explains itself in terms of asking prices", () => {
    const result = recommend(valuation({ vinted: band(50, 90), depop: band(20, 30) }));
    expect(result!.reasoning).toMatch(/listed around/i);
    expect(result!.reasoning).not.toMatch(/sells for/i);
  });

  it("names the runner-up in its reasoning", () => {
    const result = recommend(valuation({ vinted: band(90, 110), depop: band(50, 70) }));
    expect(result!.reasoning).toContain("Depop");
  });
});
