import type { PlatformPriceData } from "@/lib/types";
import type { PlatformMarket, PlatformMarketQuery } from "../types";
import { median, emptyPlatformPrices } from "../shared/median";

/**
 * eBay has its own SerpAPI engine (engine=ebay) with structured price fields,
 * so the parsing is different from the Google-site fetcher used by Vinted/Depop.
 */
async function fetchPrices({
  brand,
  subcategory,
}: PlatformMarketQuery): Promise<PlatformPriceData> {
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) return emptyPlatformPrices();

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
    if (!res.ok) return emptyPlatformPrices();

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

    if (!prices.length) return emptyPlatformPrices();
    return {
      median: median(prices),
      min: Math.min(...prices),
      max: Math.max(...prices),
      count: prices.length,
      currency: "GBP",
    };
  } catch {
    return emptyPlatformPrices();
  }
}

export const market: PlatformMarket = { fetchPrices };
