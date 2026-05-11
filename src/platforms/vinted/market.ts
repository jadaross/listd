import type { PlatformPriceData } from "@/lib/types";
import type { PlatformMarket, PlatformMarketQuery } from "../types";
import { fetchGoogleSitePrices } from "../shared/google-site-prices";

async function fetchPrices(q: PlatformMarketQuery): Promise<PlatformPriceData> {
  return fetchGoogleSitePrices(q, "vinted.co.uk");
}

export const market: PlatformMarket = { fetchPrices };
