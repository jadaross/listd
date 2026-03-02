import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getProdAppToken } from "@/lib/ebay-auth";
import type { MarketInsights, MarketIntelligence, PlatformPriceData } from "@/lib/types";
import type { Gender, MainCategory } from "@/lib/categories";
import { getCategories } from "@/lib/categories";

export const runtime = "nodejs";

interface MarketRequest {
  brand: string;
  subcategory: string;
  gender: Gender;
  main_category: MainCategory;
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
  subcategory: string,
  gender: Gender,
  main_category: MainCategory
): Promise<PlatformPriceData> {
  try {
    const token = await getProdAppToken();
    const cats = getCategories(gender, main_category);
    const q = encodeURIComponent(`${brand} ${subcategory}`.trim());
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${q}&category_ids=${cats.ebay.id}&limit=20&filter=buyingOptions:{FIXED_PRICE}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return emptyPlatform();

    const data = await res.json();
    const items: { price?: { value?: string; currency?: string } }[] =
      data.itemSummaries ?? [];

    const prices = items
      .map((item) => parseFloat(item.price?.value ?? ""))
      .filter((p) => !isNaN(p) && p > 0);

    if (!prices.length) return emptyPlatform();

    const currency = items[0]?.price?.currency ?? "GBP";
    return {
      median: median(prices),
      min: Math.min(...prices),
      max: Math.max(...prices),
      count: prices.length,
      currency,
    };
  } catch {
    return emptyPlatform();
  }
}

async function fetchEbaySoldPrices(
  brand: string,
  subcategory: string,
  gender: Gender,
  main_category: MainCategory
): Promise<PlatformPriceData> {
  try {
    const token = await getProdAppToken();
    const cats = getCategories(gender, main_category);
    const q = encodeURIComponent(`${brand} ${subcategory}`.trim());
    const url = `https://api.ebay.com/buy/marketplace_insights/v1_beta/item_sales/search?q=${q}&category_ids=${cats.ebay.id}&limit=20`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return emptyPlatform();

    const data = await res.json();
    const items: { lastSoldPrice?: { value?: string; currency?: string } }[] =
      data.itemSales ?? [];

    const prices = items
      .map((item) => parseFloat(item.lastSoldPrice?.value ?? ""))
      .filter((p) => !isNaN(p) && p > 0);

    if (!prices.length) return emptyPlatform();

    const currency = items[0]?.lastSoldPrice?.currency ?? "GBP";
    return {
      median: median(prices),
      min: Math.min(...prices),
      max: Math.max(...prices),
      count: prices.length,
      currency,
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

    const res = await fetch(url);
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
    const poundRegex = /£\s*(\d+(?:\.\d{1,2})?)/g;

    for (const result of organicResults) {
      // Check structured detected_extensions first (most reliable)
      const topDetected = result.rich_snippet?.top?.detected_extensions ?? {};
      const bottomDetected = result.rich_snippet?.bottom?.detected_extensions ?? {};
      for (const val of [...Object.values(topDetected), ...Object.values(bottomDetected)]) {
        const n = typeof val === "number" ? val : parseFloat(String(val));
        if (!isNaN(n) && n > 0 && n < 5000) {
          prices.push(n);
        }
      }

      // Also search text: title + snippet + extensions
      const extensions = [
        ...(result.rich_snippet?.top?.extensions ?? []),
        ...(result.rich_snippet?.bottom?.extensions ?? []),
      ];
      const textToSearch = [result.title ?? "", result.snippet ?? "", ...extensions].join(" ");
      poundRegex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = poundRegex.exec(textToSearch)) !== null) {
        const price = parseFloat(match[1]);
        if (!isNaN(price) && price > 0 && price < 5000) {
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
  ebayActive: PlatformPriceData,
  ebaySold: PlatformPriceData,
  vinted: PlatformPriceData,
  depop: PlatformPriceData,
): Promise<MarketIntelligence | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });

    const prompt = `You are a secondhand fashion market analyst. Given real listing data, recommend the best platform and price.

Item: ${brand} ${subcategory}, condition: ${condition}
AI suggested price: £${price_min}–£${price_max}

Live market data:
- eBay active listings: ${ebayActive.count} items, median ${fmt(ebayActive.median)}, range ${fmt(ebayActive.min)}–${fmt(ebayActive.max)}
- eBay recently sold: ${ebaySold.count} items, median sold price ${fmt(ebaySold.median)}
- Vinted active: ${vinted.count} items, median ${fmt(vinted.median)}
- Depop active: ${depop.count} items, median ${fmt(depop.median)}

Return ONLY valid JSON:
{
  "recommended_platform": "vinted" | "depop" | "ebay",
  "recommended_price": number,
  "sell_likelihood": "high" | "medium" | "low",
  "platform_reasoning": "1-2 sentences with specific numbers from the data",
  "key_insight": "the single most interesting/useful finding from this data"
}

Rules:
- recommended_price: a specific number (not a range) based on sold comps if available, else active listings
- sell_likelihood: high if there are sold comps and competition is low; low if market is saturated or no demand signal
- platform_reasoning: cite actual numbers ("Depop median is £32 vs £22 on Vinted")
- key_insight: something genuinely useful ("Only 8 of 23 eBay listings have sold — supply exceeds demand")
- If a platform has no data (count=0), do not recommend it
- Return ONLY the JSON object, no markdown fences, no explanation`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as MarketIntelligence;
    // Validate required fields
    if (!parsed.recommended_platform || !parsed.recommended_price || !parsed.sell_likelihood) {
      return null;
    }
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
      gender = "women",
      main_category = "other",
      condition = "Good",
      price_min = 0,
      price_max = 0,
    } = body;

    const query = `${brand} ${subcategory}`.trim();

    const [ebayActive, ebaySold, vinted, depop] = await Promise.all([
      fetchEbayPrices(brand, subcategory, gender, main_category),
      fetchEbaySoldPrices(brand, subcategory, gender, main_category),
      fetchSerpApiPrices(brand, subcategory, "vinted.co.uk"),
      fetchSerpApiPrices(brand, subcategory, "depop.com"),
    ]);

    const ebay: PlatformPriceData = {
      ...ebayActive,
      sold_median: ebaySold.median,
      sold_count: ebaySold.count,
    };

    const intelligence = await synthesiseInsights(
      brand,
      subcategory,
      condition,
      price_min,
      price_max,
      ebayActive,
      ebaySold,
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
