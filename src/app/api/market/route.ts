import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  MarketInsights,
  MarketIntelligence,
  Platform,
  PlatformPriceData,
  PlatformReasoning,
} from "@/lib/types";

export const runtime = "nodejs";

interface MarketRequest {
  brand: string;
  subcategory: string;
  gender?: string;
  main_category?: string;
  condition?: string;
  price_min?: number;
  price_max?: number;
}

function median(prices: number[]): number | null {
  if (!prices.length) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function emptyPlatform(currency = "GBP"): PlatformPriceData {
  return { median: null, min: null, max: null, count: 0, currency };
}

async function fetchEbayPrices(
  brand: string,
  subcategory: string
): Promise<PlatformPriceData> {
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) return emptyPlatform();

  try {
    const q = encodeURIComponent(`${brand} ${subcategory}`);
    const url = `https://serpapi.com/search.json?engine=ebay&ebay_domain=ebay.co.uk&_nkw=${q}&api_key=${serpApiKey}&LH_ItemCondition=3000`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return emptyPlatform();

    const data = await res.json();
    const prices: number[] = [];

    for (const item of (data.organic_results ?? []) as {
      price?: { extracted?: number; from?: { extracted?: number }; to?: { extracted?: number } };
    }[]) {
      const single = item.price?.extracted;
      if (typeof single === "number" && single >= 3 && single < 5000) {
        prices.push(single);
      } else {
        const from = item.price?.from?.extracted;
        const to = item.price?.to?.extracted;
        if (typeof from === "number" && typeof to === "number") {
          const mid = (from + to) / 2;
          if (mid >= 3 && mid < 5000) prices.push(mid);
        }
      }
    }

    if (!prices.length) return emptyPlatform();
    return {
      median: median(prices),
      min: Math.min(...prices),
      max: Math.max(...prices),
      count: prices.length,
      currency: "GBP",
    };
  } catch {
    return emptyPlatform();
  }
}

async function fetchSerpApiPrices(
  brand: string,
  subcategory: string,
  site: "vinted.co.uk" | "depop.com"
): Promise<PlatformPriceData> {
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) return emptyPlatform();

  try {
    const q = encodeURIComponent(`${brand} ${subcategory} site:${site}`);
    const url = `https://serpapi.com/search.json?engine=google&q=${q}&gl=gb&hl=en&api_key=${serpApiKey}&num=20`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return emptyPlatform();

    const data = await res.json();
    const organicResults: {
      title?: string;
      snippet?: string;
      rich_snippet?: {
        top?: {
          extensions?: string[];
          detected_extensions?: Record<string, number | string>;
        };
        bottom?: {
          extensions?: string[];
          detected_extensions?: Record<string, number | string>;
        };
      };
      price?: string;
    }[] = data.organic_results ?? [];

    const prices: number[] = [];
    // Negative lookahead skips Vinted's "£18.68. £20.31incl." buyer-protection fee prices
    const poundRegex = /£\s*(\d+(?:\.\d{1,2})?)(?!\s*incl)/g;

    for (const result of organicResults) {
      // Check structured detected_extensions first (most reliable)
      const topDetected = result.rich_snippet?.top?.detected_extensions ?? {};
      const bottomDetected = result.rich_snippet?.bottom?.detected_extensions ?? {};
      for (const val of [...Object.values(topDetected), ...Object.values(bottomDetected)]) {
        const n = typeof val === "number" ? val : parseFloat(String(val));
        if (!isNaN(n) && n >= 4 && n < 5000) {
          prices.push(n);
        }
      }

      // Search text: title + snippet + extensions
      // Strip "from £X.XX" patterns first (postage costs, not item prices)
      const extensions = [
        ...(result.rich_snippet?.top?.extensions ?? []),
        ...(result.rich_snippet?.bottom?.extensions ?? []),
      ];
      const rawText = [result.title ?? "", result.snippet ?? "", ...extensions].join(" ");
      const textToSearch = rawText.replace(/\bfrom\s+£\s*\d+(?:\.\d{1,2})?/gi, "");
      poundRegex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = poundRegex.exec(textToSearch)) !== null) {
        const price = parseFloat(match[1]);
        // Minimum £4 to exclude fees/postage that slipped through
        if (!isNaN(price) && price >= 4 && price < 5000) {
          prices.push(price);
        }
      }
    }

    if (!prices.length) return emptyPlatform();

    return {
      median: median(prices),
      min: Math.min(...prices),
      max: Math.max(...prices),
      count: prices.length,
      currency: "GBP",
    };
  } catch {
    return emptyPlatform();
  }
}

function fmt(val: number | null | undefined): string {
  return val !== null && val !== undefined ? `£${val.toFixed(0)}` : "no data";
}

async function synthesiseInsights(
  brand: string,
  subcategory: string,
  condition: string,
  price_min: number,
  price_max: number,
  ebay: PlatformPriceData,
  vinted: PlatformPriceData,
  depop: PlatformPriceData,
): Promise<MarketIntelligence | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });

    const prompt = `You are a secondhand fashion market analyst. Given real listing data, recommend the best platform and price, and explain how each of the three platforms compares for this item.

Item: ${brand} ${subcategory}, condition: ${condition}
AI suggested price: £${price_min}–£${price_max}

Live market data:
- eBay active listings: ${ebay.count} items, median ${fmt(ebay.median)}, range ${fmt(ebay.min)}–${fmt(ebay.max)}
- Vinted active: ${vinted.count} items, median ${fmt(vinted.median)}
- Depop active: ${depop.count} items, median ${fmt(depop.median)}

Return ONLY valid JSON:
{
  "recommended_platform": "vinted" | "depop" | "ebay",
  "recommended_price": number,
  "sell_likelihood": "high" | "medium" | "low",
  "key_insight": "the single most interesting/useful finding from this data",
  "per_platform": {
    "vinted": {
      "platform_reasoning": "why this platform suits the item (the upside)",
      "trade_off": "what's worse about this platform for this item",
      "estimated_sell_time": "e.g. '4 days'",
      "estimated_views_per_week": "e.g. '~110/wk'"
    },
    "depop": { "platform_reasoning": "", "trade_off": "", "estimated_sell_time": "", "estimated_views_per_week": "" },
    "ebay":  { "platform_reasoning": "", "trade_off": "", "estimated_sell_time": "", "estimated_views_per_week": "" }
  }
}

Rules:
- recommended_platform: ALWAYS pick one of "vinted", "depop", "ebay" — never return null. Prefer platforms with data; if all are empty, use the AI suggested price and general knowledge to pick.
- recommended_price: specific number based on market data if available, otherwise use the midpoint of the AI suggested price range. Never return null or 0.
- sell_likelihood: "high" if demand signals are strong; "medium" if uncertain; "low" if oversupplied.
- per_platform.*.platform_reasoning: 1-2 sentences citing the upside for THAT platform (audience, fees, sell-through). Reference specific numbers when available.
- per_platform.*.trade_off: 1 sentence on the downside (fees, slower turnover, lower median). Always include something — every platform has a trade-off.
- per_platform.*.estimated_sell_time: realistic median time to sell on that platform, in days (e.g. "4 days", "9 days").
- per_platform.*.estimated_views_per_week: realistic views/week (e.g. "~80/wk", "~140/wk"). Be plausible — eBay typically gets more views than Depop for workwear; Depop more than Vinted for trend-led pieces.
- key_insight: the single most useful finding (one short sentence).
- Return ONLY the JSON object, no markdown fences, no explanation.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as MarketIntelligence;
    if (!parsed.recommended_platform || !parsed.sell_likelihood) {
      return null;
    }
    if (!parsed.recommended_price) {
      parsed.recommended_price = Math.round((price_min + price_max) / 2);
    }
    // Backfill per_platform if the model omitted entries — recommendation screen
    // depends on all three being present.
    const empty: PlatformReasoning = {
      platform_reasoning: "",
      trade_off: "",
      estimated_sell_time: "",
      estimated_views_per_week: "",
    };
    const pp = (parsed.per_platform ?? {}) as Partial<Record<Platform, PlatformReasoning>>;
    parsed.per_platform = {
      vinted: { ...empty, ...(pp.vinted ?? {}) },
      depop:  { ...empty, ...(pp.depop  ?? {}) },
      ebay:   { ...empty, ...(pp.ebay   ?? {}) },
    };
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<MarketRequest>;
    const {
      brand = "",
      subcategory = "",
      condition = "Good",
      price_min = 0,
      price_max = 0,
    } = body;

    const query = `${brand} ${subcategory}`.trim();

    const [ebay, vinted, depop] = await Promise.all([
      fetchEbayPrices(brand, subcategory),
      fetchSerpApiPrices(brand, subcategory, "vinted.co.uk"),
      fetchSerpApiPrices(brand, subcategory, "depop.com"),
    ]);

    const intelligence = await synthesiseInsights(
      brand,
      subcategory,
      condition,
      price_min,
      price_max,
      ebay,
      vinted,
      depop,
    );

    const insights: MarketInsights = { ebay, vinted, depop, query, intelligence };
    return NextResponse.json(insights);
  } catch (err) {
    console.error("Market route error:", err);
    return NextResponse.json(
      { error: "Market lookup failed" },
      { status: 500 }
    );
  }
}
