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
