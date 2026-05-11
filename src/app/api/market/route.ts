import { NextRequest, NextResponse } from "next/server";
import type { MarketInsights, Platform, PlatformPriceData } from "@/lib/types";
import { PLATFORM_IDS } from "@/platforms";
import { platformMarket } from "@/platforms/registry";
import { synthesiseMarketIntelligence } from "@/lib/llm/market-synthesis";

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

    const priceList = await Promise.all(
      PLATFORM_IDS.map((id) =>
        platformMarket[id].fetchPrices({ brand, subcategory })
      )
    );
    const prices = Object.fromEntries(
      PLATFORM_IDS.map((id, i) => [id, priceList[i]])
    ) as Record<Platform, PlatformPriceData>;

    const intelligence = await synthesiseMarketIntelligence({
      brand,
      subcategory,
      condition,
      priceMin: price_min,
      priceMax: price_max,
      prices,
    });

    const insights: MarketInsights = {
      ebay: prices.ebay,
      vinted: prices.vinted,
      depop: prices.depop,
      query,
      intelligence,
    };
    return NextResponse.json(insights);
  } catch (err) {
    console.error("Market route error:", err);
    return NextResponse.json({ error: "Market lookup failed" }, { status: 500 });
  }
}
