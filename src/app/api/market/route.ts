import { NextRequest, NextResponse } from "next/server";
import { getAppToken } from "@/lib/ebay-auth";
import type { MarketInsights, PlatformPriceData } from "@/lib/types";
import type { Gender, MainCategory } from "@/lib/categories";
import { getCategories } from "@/lib/categories";

export const runtime = "nodejs";

interface MarketRequest {
  brand: string;
  subcategory: string;
  gender: Gender;
  main_category: MainCategory;
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
    const token = await getAppToken();
    const isSandbox = process.env.EBAY_ENVIRONMENT !== "production";
    const apiBase = isSandbox ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
    const cats = getCategories(gender, main_category);
    const q = encodeURIComponent(`${brand} ${subcategory}`.trim());
    const url = `${apiBase}/buy/browse/v1/item_summary/search?q=${q}&category_ids=${cats.ebay.id}&limit=20&filter=buyingOptions:{FIXED_PRICE}`;

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
      rich_snippet?: {
        top?: { extensions?: string[] };
        bottom?: { extensions?: string[] };
      };
      snippet?: string;
    }[] = data.organic_results ?? [];

    const prices: number[] = [];
    const poundRegex = /£\s*(\d+(?:\.\d{1,2})?)/g;

    for (const result of organicResults) {
      const extensions = [
        ...(result.rich_snippet?.top?.extensions ?? []),
        ...(result.rich_snippet?.bottom?.extensions ?? []),
      ];

      const textToSearch = [result.snippet ?? "", ...extensions].join(" ");
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<MarketRequest>;
    const { brand = "", subcategory = "", gender = "women", main_category = "other" } = body;

    const query = `${brand} ${subcategory}`.trim();

    const [ebay, vinted, depop] = await Promise.all([
      fetchEbayPrices(brand, subcategory, gender, main_category),
      fetchSerpApiPrices(brand, subcategory, "vinted.co.uk"),
      fetchSerpApiPrices(brand, subcategory, "depop.com"),
    ]);

    const insights: MarketInsights = { ebay, vinted, depop, query };
    return NextResponse.json(insights);
  } catch (err) {
    console.error("Market route error:", err);
    return NextResponse.json(
      { error: "Market lookup failed" },
      { status: 500 }
    );
  }
}
