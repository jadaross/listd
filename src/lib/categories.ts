export interface PlatformCategories {
  vinted: string;
  depop: string;
  ebay: { id: number; name: string };
}

export type Gender = "women" | "men" | "kids" | "unisex";
export type MainCategory =
  | "tops"
  | "bottoms"
  | "dresses"
  | "outerwear"
  | "knitwear"
  | "swimwear"
  | "underwear"
  | "sportswear"
  | "shoes"
  | "accessories"
  | "bags"
  | "other";

// eBay category IDs:
// 15709 = Women's Clothing, 1059 = Men's Clothing
// 171146 = Boys' Clothing, 171147 = Girls' Clothing
// 11450 = Clothing, Shoes & Accessories (fallback)

type CategoryMap = Partial<Record<Gender, Partial<Record<MainCategory, PlatformCategories>>>>;

const CATEGORY_MAP: CategoryMap = {
  women: {
    tops: {
      vinted: "Women / Tops & T-shirts",
      depop: "Womens / Tops",
      ebay: { id: 15709, name: "Women's Clothing" },
    },
    bottoms: {
      vinted: "Women / Trousers & Shorts",
      depop: "Womens / Bottoms",
      ebay: { id: 15709, name: "Women's Clothing" },
    },
    dresses: {
      vinted: "Women / Dresses",
      depop: "Womens / Dresses",
      ebay: { id: 63861, name: "Women's Dresses" },
    },
    outerwear: {
      vinted: "Women / Coats & Jackets",
      depop: "Womens / Coats & Jackets",
      ebay: { id: 15724, name: "Women's Coats & Jackets" },
    },
    knitwear: {
      vinted: "Women / Jumpers & Cardigans",
      depop: "Womens / Knitwear",
      ebay: { id: 15709, name: "Women's Clothing" },
    },
    swimwear: {
      vinted: "Women / Swimwear",
      depop: "Womens / Swimwear",
      ebay: { id: 15709, name: "Women's Clothing" },
    },
    underwear: {
      vinted: "Women / Underwear & Nightwear",
      depop: "Womens / Underwear & Lingerie",
      ebay: { id: 15709, name: "Women's Clothing" },
    },
    sportswear: {
      vinted: "Women / Sports & Gym",
      depop: "Womens / Activewear",
      ebay: { id: 15709, name: "Women's Clothing" },
    },
    shoes: {
      vinted: "Women / Shoes",
      depop: "Womens / Shoes",
      ebay: { id: 57990, name: "Women's Shoes" },
    },
    accessories: {
      vinted: "Women / Accessories",
      depop: "Womens / Accessories",
      ebay: { id: 4250, name: "Women's Accessories" },
    },
    bags: {
      vinted: "Women / Bags",
      depop: "Womens / Bags & Purses",
      ebay: { id: 169291, name: "Women's Bags & Handbags" },
    },
    other: {
      vinted: "Women / Other",
      depop: "Womens / Other",
      ebay: { id: 15709, name: "Women's Clothing" },
    },
  },
  men: {
    tops: {
      vinted: "Men / Tops & T-shirts",
      depop: "Mens / Tops",
      ebay: { id: 1059, name: "Men's Clothing" },
    },
    bottoms: {
      vinted: "Men / Trousers",
      depop: "Mens / Bottoms",
      ebay: { id: 1059, name: "Men's Clothing" },
    },
    dresses: {
      vinted: "Men / Other",
      depop: "Mens / Other",
      ebay: { id: 1059, name: "Men's Clothing" },
    },
    outerwear: {
      vinted: "Men / Coats & Jackets",
      depop: "Mens / Coats & Jackets",
      ebay: { id: 57988, name: "Men's Coats & Jackets" },
    },
    knitwear: {
      vinted: "Men / Jumpers & Cardigans",
      depop: "Mens / Knitwear",
      ebay: { id: 1059, name: "Men's Clothing" },
    },
    swimwear: {
      vinted: "Men / Swimwear",
      depop: "Mens / Swimwear",
      ebay: { id: 1059, name: "Men's Clothing" },
    },
    underwear: {
      vinted: "Men / Underwear & Nightwear",
      depop: "Mens / Underwear",
      ebay: { id: 1059, name: "Men's Clothing" },
    },
    sportswear: {
      vinted: "Men / Sports & Gym",
      depop: "Mens / Activewear",
      ebay: { id: 1059, name: "Men's Clothing" },
    },
    shoes: {
      vinted: "Men / Shoes",
      depop: "Mens / Shoes",
      ebay: { id: 93427, name: "Men's Shoes" },
    },
    accessories: {
      vinted: "Men / Accessories",
      depop: "Mens / Accessories",
      ebay: { id: 4250, name: "Men's Accessories" },
    },
    bags: {
      vinted: "Men / Bags",
      depop: "Mens / Bags",
      ebay: { id: 169291, name: "Men's Bags" },
    },
    other: {
      vinted: "Men / Other",
      depop: "Mens / Other",
      ebay: { id: 1059, name: "Men's Clothing" },
    },
  },
  kids: {
    tops: {
      vinted: "Kids / Tops & T-shirts",
      depop: "Kids / Tops",
      ebay: { id: 171146, name: "Boys' Clothing" },
    },
    bottoms: {
      vinted: "Kids / Trousers & Shorts",
      depop: "Kids / Bottoms",
      ebay: { id: 171146, name: "Boys' Clothing" },
    },
    dresses: {
      vinted: "Kids / Dresses",
      depop: "Kids / Dresses",
      ebay: { id: 171147, name: "Girls' Clothing" },
    },
    outerwear: {
      vinted: "Kids / Coats & Jackets",
      depop: "Kids / Coats & Jackets",
      ebay: { id: 171146, name: "Boys' Clothing" },
    },
    knitwear: {
      vinted: "Kids / Jumpers & Cardigans",
      depop: "Kids / Knitwear",
      ebay: { id: 171146, name: "Boys' Clothing" },
    },
    swimwear: {
      vinted: "Kids / Swimwear",
      depop: "Kids / Swimwear",
      ebay: { id: 171146, name: "Boys' Clothing" },
    },
    underwear: {
      vinted: "Kids / Underwear",
      depop: "Kids / Underwear",
      ebay: { id: 171146, name: "Boys' Clothing" },
    },
    sportswear: {
      vinted: "Kids / Sports & Gym",
      depop: "Kids / Activewear",
      ebay: { id: 171146, name: "Boys' Clothing" },
    },
    shoes: {
      vinted: "Kids / Shoes",
      depop: "Kids / Shoes",
      ebay: { id: 57991, name: "Kids' Shoes" },
    },
    accessories: {
      vinted: "Kids / Accessories",
      depop: "Kids / Accessories",
      ebay: { id: 171146, name: "Boys' Clothing" },
    },
    bags: {
      vinted: "Kids / Bags",
      depop: "Kids / Bags",
      ebay: { id: 171146, name: "Boys' Clothing" },
    },
    other: {
      vinted: "Kids / Other",
      depop: "Kids / Other",
      ebay: { id: 171146, name: "Boys' Clothing" },
    },
  },
  unisex: {
    tops: {
      vinted: "Unisex / Tops",
      depop: "Womens / Tops",
      ebay: { id: 11450, name: "Clothing" },
    },
    bottoms: {
      vinted: "Unisex / Trousers",
      depop: "Womens / Bottoms",
      ebay: { id: 11450, name: "Clothing" },
    },
    dresses: {
      vinted: "Women / Dresses",
      depop: "Womens / Dresses",
      ebay: { id: 63861, name: "Women's Dresses" },
    },
    outerwear: {
      vinted: "Unisex / Coats & Jackets",
      depop: "Womens / Coats & Jackets",
      ebay: { id: 11450, name: "Clothing" },
    },
    knitwear: {
      vinted: "Unisex / Jumpers & Cardigans",
      depop: "Womens / Knitwear",
      ebay: { id: 11450, name: "Clothing" },
    },
    swimwear: {
      vinted: "Unisex / Swimwear",
      depop: "Womens / Swimwear",
      ebay: { id: 11450, name: "Clothing" },
    },
    underwear: {
      vinted: "Unisex / Underwear",
      depop: "Womens / Underwear & Lingerie",
      ebay: { id: 11450, name: "Clothing" },
    },
    sportswear: {
      vinted: "Unisex / Sports & Gym",
      depop: "Womens / Activewear",
      ebay: { id: 11450, name: "Clothing" },
    },
    shoes: {
      vinted: "Unisex / Shoes",
      depop: "Womens / Shoes",
      ebay: { id: 11450, name: "Shoes" },
    },
    accessories: {
      vinted: "Unisex / Accessories",
      depop: "Womens / Accessories",
      ebay: { id: 4250, name: "Accessories" },
    },
    bags: {
      vinted: "Unisex / Bags",
      depop: "Womens / Bags & Purses",
      ebay: { id: 169291, name: "Bags" },
    },
    other: {
      vinted: "Unisex / Other",
      depop: "Womens / Other",
      ebay: { id: 11450, name: "Clothing" },
    },
  },
};

const FALLBACK: PlatformCategories = {
  vinted: "Clothing",
  depop: "Clothing",
  ebay: { id: 11450, name: "Clothing, Shoes & Accessories" },
};

export function getCategories(gender: Gender, main: MainCategory): PlatformCategories {
  return CATEGORY_MAP[gender]?.[main] ?? FALLBACK;
}
