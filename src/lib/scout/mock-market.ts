import type { ScoutComp, ScoutMarket } from "@/lib/types";

/**
 * Placeholder market data for the Scout flow. Lifted verbatim from the design
 * prototype (`listd-scout.jsx`). Real eBay sold-comps will replace this in a
 * follow-up; the swap is local to this module so no UI changes.
 */

const SCOUT_COMPS: ScoutComp[] = [
  { label: "Carhartt Detroit · brown · M", price: 48, when: "3d ago", plat: "ebay", color: "var(--color-platform-ebay)" },
  { label: "Detroit J97 vintage · M",      price: 44, when: "6d ago", plat: "depop", color: "var(--color-platform-depop)" },
  { label: "Carhartt duck chore · M",      price: 51, when: "1w ago", plat: "ebay", color: "var(--color-platform-ebay)" },
];

const WEEKLY_LOOSE = [3, 5, 4, 6, 5];
const WEEKLY_TIGHT = [4, 6, 5, 7, 8];

export function getMockMarket(tagAdded: boolean): ScoutMarket {
  const range: [number, number] = tagAdded ? [44, 52] : [30, 55];
  return {
    range,
    median: Math.round((range[0] + range[1]) / 2),
    sold_30d: tagAdded ? 23 : 14,
    weekly_sold: tagAdded ? WEEKLY_TIGHT : WEEKLY_LOOSE,
    comps: SCOUT_COMPS,
    currency: "GBP",
  };
}
