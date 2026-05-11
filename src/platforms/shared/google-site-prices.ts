import type { PlatformPriceData } from "@/lib/types";
import type { PlatformMarketQuery } from "../types";
import { median, emptyPlatformPrices } from "./median";

/**
 * Vinted and Depop have no public price API. Both are scraped via
 * SerpAPI's Google engine with a `site:` qualifier — same parsing logic for both.
 */
export async function fetchGoogleSitePrices(
  { brand, subcategory }: PlatformMarketQuery,
  site: "vinted.co.uk" | "depop.com"
): Promise<PlatformPriceData> {
  const serpApiKey = process.env.SERPAPI_KEY;
  if (!serpApiKey) return emptyPlatformPrices();

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
    if (!res.ok) return emptyPlatformPrices();

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
      const topDetected = result.rich_snippet?.top?.detected_extensions ?? {};
      const bottomDetected = result.rich_snippet?.bottom?.detected_extensions ?? {};
      for (const val of [...Object.values(topDetected), ...Object.values(bottomDetected)]) {
        const n = typeof val === "number" ? val : parseFloat(String(val));
        if (!isNaN(n) && n >= 4 && n < 5000) prices.push(n);
      }

      const extensions = [
        ...(result.rich_snippet?.top?.extensions ?? []),
        ...(result.rich_snippet?.bottom?.extensions ?? []),
      ];
      const rawText = [result.title ?? "", result.snippet ?? "", ...extensions].join(" ");
      // Strip "from £X.XX" patterns first (postage costs, not item prices)
      const textToSearch = rawText.replace(/\bfrom\s+£\s*\d+(?:\.\d{1,2})?/gi, "");
      poundRegex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = poundRegex.exec(textToSearch)) !== null) {
        const price = parseFloat(match[1]);
        // Minimum £4 to exclude fees/postage that slipped through
        if (!isNaN(price) && price >= 4 && price < 5000) prices.push(price);
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
