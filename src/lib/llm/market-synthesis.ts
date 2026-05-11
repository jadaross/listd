import type {
  MarketIntelligence,
  Platform,
  PlatformPriceData,
  PlatformReasoning,
} from "@/lib/types";
import { PLATFORM_IDS } from "@/platforms";
import { MODELS, anthropicClient, extractJsonObject } from "./client";

export interface MarketSynthesisInput {
  brand: string;
  subcategory: string;
  condition: string;
  priceMin: number;
  priceMax: number;
  prices: Record<Platform, PlatformPriceData>;
}

function fmt(val: number | null | undefined): string {
  return val !== null && val !== undefined ? `£${val.toFixed(0)}` : "no data";
}

function buildPrompt({
  brand,
  subcategory,
  condition,
  priceMin,
  priceMax,
  prices,
}: MarketSynthesisInput): string {
  const { ebay, vinted, depop } = prices;
  return `You are a secondhand fashion market analyst. Given real listing data, recommend the best platform and price, and explain how each of the three platforms compares for this item.

Item: ${brand} ${subcategory}, condition: ${condition}
AI suggested price: £${priceMin}–£${priceMax}

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
}

const EMPTY_REASONING: PlatformReasoning = {
  platform_reasoning: "",
  trade_off: "",
  estimated_sell_time: "",
  estimated_views_per_week: "",
};

/**
 * Returns null if the model output is unusable. The route uses null to signal
 * "no recommendation" rather than failing the whole market response.
 */
export async function synthesiseMarketIntelligence(
  input: MarketSynthesisInput
): Promise<MarketIntelligence | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const client = anthropicClient();
    const message = await client.messages.create({
      model: MODELS.marketSynthesis,
      max_tokens: 900,
      messages: [{ role: "user", content: buildPrompt(input) }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(extractJsonObject(text)) as MarketIntelligence;

    if (!parsed.recommended_platform || !parsed.sell_likelihood) return null;
    if (!parsed.recommended_price) {
      parsed.recommended_price = Math.round((input.priceMin + input.priceMax) / 2);
    }
    const pp = (parsed.per_platform ?? {}) as Partial<Record<Platform, PlatformReasoning>>;
    parsed.per_platform = Object.fromEntries(
      PLATFORM_IDS.map((id) => [id, { ...EMPTY_REASONING, ...(pp[id] ?? {}) }])
    ) as Record<Platform, PlatformReasoning>;
    return parsed;
  } catch {
    return null;
  }
}
