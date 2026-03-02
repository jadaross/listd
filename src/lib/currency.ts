export type Currency = "GBP" | "EUR" | "USD" | "AUD";

export const CURRENCIES: Record<Currency, { symbol: string; label: string; rate: number }> = {
  GBP: { symbol: "£", label: "GBP", rate: 1 },
  EUR: { symbol: "€", label: "EUR", rate: 1.18 },
  USD: { symbol: "$", label: "USD", rate: 1.27 },
  AUD: { symbol: "A$", label: "AUD", rate: 1.98 },
};

export const CURRENCY_LIST: Currency[] = ["GBP", "EUR", "USD", "AUD"];

/** Format a GBP amount converted to the target currency, rounded to nearest whole unit */
export function fmtPrice(amountGBP: number | null | undefined, currency: Currency): string {
  if (amountGBP === null || amountGBP === undefined) return "—";
  const { symbol, rate } = CURRENCIES[currency];
  return `${symbol}${Math.round(amountGBP * rate)}`;
}

/** Format a GBP price range converted to the target currency */
export function fmtRange(minGBP: number, maxGBP: number, currency: Currency): string {
  const { symbol, rate } = CURRENCIES[currency];
  return `${symbol}${Math.round(minGBP * rate)}–${symbol}${Math.round(maxGBP * rate)}`;
}
