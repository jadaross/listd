// Mock data shared by stub screens (History, Settings, photo placeholders).
// Mirrors ios/Listd/Models.swift MockData where it matches.

export interface PhotoRef {
  id: number;
  label: string;
  hue: number;
}

export const MOCK_PHOTOS: PhotoRef[] = [
  { id: 1, label: "front",   hue: 168 },
  { id: 2, label: "back",    hue: 172 },
  { id: 3, label: "tag",     hue: 38  },
  { id: 4, label: "detail",  hue: 154 },
  { id: 5, label: "on-body", hue: 200 },
];

export const ADVICE_PHOTOS: { id: string; label: string; hint: string }[] = [
  { id: "back",  label: "Back of jacket",   hint: "Spot fading or print wear" },
  { id: "label", label: "Brand label",      hint: "Confirms era + authenticity" },
  { id: "tag",   label: "Inside care tag",  hint: "Fabric blend + wash info" },
];

export const HISTORY_FIXTURES = [
  { title: "Wrangler Denim Jacket",     platform: "Vinted", price: 28,  status: "sold",   when: "2 days ago" },
  { title: "Champion Reverse Weave",    platform: "Depop",  price: 35,  status: "active", when: "5 days ago" },
  { title: "North Face Nuptse",         platform: "eBay",   price: 110, status: "active", when: "1 wk ago"   },
  { title: "Levi's 501 Vintage",        platform: "Vinted", price: 22,  status: "sold",   when: "2 wks ago"  },
];
