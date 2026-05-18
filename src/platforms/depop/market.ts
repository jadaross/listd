import type { PlatformPriceData } from "@/lib/types";
import type { PlatformMarket, PlatformMarketQuery } from "../types";
import { fetchGoogleSitePrices } from "../shared/google-site-prices";
import { runApifyActor, coercePrice, toGbp } from "../shared/apify";
import { buildPriceData } from "../shared/median";

/** Subset of the piotrv1001/depop-listings-scraper dataset shape we rely on. */
interface DepopItem {
  price?: number | string;
  currency?: string;
}

/**
 * Prices come from Apify's managed Depop scraper (structured JSON). When
 * APIFY_TOKEN is unset or the run fails, runApifyActor returns null and we
 * fall back to the SerpAPI Google-site scraper.
 */
async function fetchPrices(q: PlatformMarketQuery): Promise<PlatformPriceData> {
  const query = `${q.brand} ${q.subcategory}`.trim();

  const items = await runApifyActor<DepopItem>("piotrv1001~depop-listings-scraper", {
    searchQueries: [query],
    maxItems: 40,
  });
  if (items === null) return fetchGoogleSitePrices(q, "depop.com");

  // The Depop actor returns USD prices — normalise everything to GBP.
  const prices = items
    .map((it) => {
      const raw = coercePrice(it.price);
      return raw === null ? null : toGbp(raw, it.currency);
    })
    .filter((n): n is number => n !== null && n >= 1 && n < 5000);

  return buildPriceData(prices);
}

export const market: PlatformMarket = { fetchPrices };
