/**
 * Thin wrapper over Apify's "run actor synchronously" API. Apify provides
 * managed, structured scrapers for Vinted/Depop — far cleaner price data than
 * regex-scraping Google snippets via SerpAPI.
 *
 * Returns null when APIFY_TOKEN is unset or the run fails, so callers can fall
 * back to another price source rather than failing the whole market lookup.
 */
export async function runApifyActor<T = unknown>(
  actorId: string,
  input: Record<string, unknown>,
  timeoutMs = 60_000
): Promise<T[] | null> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return null;

  // Apify API URLs identify actors as `username~actor-name`.
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? (data as T[]) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Coerces Apify price fields (number, numeric string, or { amount }) to a number. */
export function coercePrice(
  value: number | string | { amount?: number | string } | null | undefined
): number | null {
  if (typeof value === "number") return isNaN(value) ? null : value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
  }
  if (value && typeof value === "object") return coercePrice(value.amount);
  return null;
}

/**
 * Approximate FX rates to GBP. The Depop actor returns USD prices regardless of
 * region; market data only needs ballpark figures so a static rate is fine.
 */
const GBP_RATES: Record<string, number> = { GBP: 1, USD: 0.75, EUR: 0.86 };

/** Converts an amount to GBP, or returns null for an unknown currency. */
export function toGbp(amount: number, currency = "GBP"): number | null {
  const rate = GBP_RATES[currency.toUpperCase()];
  return rate === undefined ? null : amount * rate;
}
