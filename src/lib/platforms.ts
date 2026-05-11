import type { Platform } from "./types";

export const PLATFORM_META: Record<Platform, {
  name: string;
  audience: string;
  feeLabel: string;
  feePct: number;
  color: string;
  appUrl: string;
  webUrl: string;
}> = {
  vinted: {
    name: "Vinted",
    audience: "Europe · resale-first",
    feeLabel: "0%",
    feePct: 0,
    color: "#09b1ba",
    appUrl: "vinted://",
    webUrl: "https://www.vinted.co.uk/",
  },
  depop: {
    name: "Depop",
    audience: "Gen-Z · style-led",
    feeLabel: "10%",
    feePct: 10,
    color: "#f00d2d",
    appUrl: "depop://",
    webUrl: "https://www.depop.com/",
  },
  ebay: {
    name: "eBay",
    audience: "Global · all categories",
    feeLabel: "13.25%",
    feePct: 13.25,
    color: "#0064d2",
    appUrl: "ebay://",
    webUrl: "https://www.ebay.co.uk/",
  },
};

export const PLATFORM_ORDER: Platform[] = ["vinted", "depop", "ebay"];

export function netPrice(price: number, platform: Platform): number {
  return price * (1 - PLATFORM_META[platform].feePct / 100);
}
