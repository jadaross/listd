import type { PlatformPriceData } from "@/lib/types";
import type { PlatformMarket, PlatformMarketQuery } from "../types";
import { fetchGoogleSitePrices } from "../shared/google-site-prices";
import { runApifyActor, coercePrice, toGbp } from "../shared/apify";
import { buildPriceData } from "../shared/median";

/** Subset of the kazkn/vinted-smart-scraper dataset shape we rely on. */
interface VintedItem {
  price?: number | string | { amount?: number | string };
  currency?: string;
}

/**
 * Prices come from Apify's managed Vinted scraper (structured JSON). When
 * APIFY_TOKEN is unset or the run fails, runApifyActor returns null and we
 * fall back to the SerpAPI Google-site scraper.
 */
async function fetchPrices(q: PlatformMarketQuery): Promise<PlatformPriceData> {
  const query = `${q.brand} ${q.subcategory}`.trim();

  const items = await runApifyActor<VintedItem>("kazkn~vinted-smart-scraper", {
    mode: "SEARCH", // "SOLD_ITEMS" mode is also available for true sold comps
    query,
    countries: ["uk"],
    maxItems: 40,
  });
  if (items === null) return fetchGoogleSitePrices(q, "vinted.co.uk");

  const prices = items
    .map((it) => {
      const raw = coercePrice(it.price);
      return raw === null ? null : toGbp(raw, it.currency);
    })
    .filter((n): n is number => n !== null && n >= 1 && n < 5000);

  return buildPriceData(prices);
}

export const market: PlatformMarket = { fetchPrices };
