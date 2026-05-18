export function median(prices: number[]): number | null {
  if (!prices.length) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function emptyPlatformPrices(currency = "GBP") {
  return { median: null, min: null, max: null, count: 0, currency };
}

/** Builds a PlatformPriceData summary from a non-empty list of prices. */
export function buildPriceData(prices: number[], currency = "GBP") {
  if (!prices.length) return emptyPlatformPrices(currency);
  return {
    median: median(prices),
    min: Math.min(...prices),
    max: Math.max(...prices),
    count: prices.length,
    currency,
  };
}
