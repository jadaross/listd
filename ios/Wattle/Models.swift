import SwiftUI

// MARK: - Domain types

enum PlatformID: String, CaseIterable, Identifiable, Hashable {
    case vinted, depop, ebay
    var id: String { rawValue }
}

struct Platform: Identifiable, Hashable {
    let id: PlatformID
    let name: String
    let audience: String
    let feeLabel: String
    let feePct: Double
    let price: Double
    let sellRate: Int
    let color: Color

    var net: Double { price * (1 - feePct / 100) }
}

struct Item {
    let title: String
    let brand: String
    let size: String
    let condition: String
    let material: String
}

struct PhotoRef: Identifiable, Hashable {
    let id: Int
    let label: String
    let hue: Double
}

struct ListingField: Equatable, Identifiable {
    let label: String
    let value: String
    var hint: String?
    var id: String { label }
}

struct Caption: Equatable {
    var title: String
    var body: String
    var tags: [String]
    var fields: [ListingField] = []
}

enum FeedbackChip: String, CaseIterable, Identifiable {
    case shorter, longer, casual, serious, measurements, hashtags, condition, vintage
    var id: String { rawValue }

    var label: String {
        switch self {
        case .shorter: return "Shorter"
        case .longer: return "More detail"
        case .casual: return "More casual"
        case .serious: return "Less serious"
        case .measurements: return "+ Measurements"
        case .hashtags: return "+ Hashtags"
        case .condition: return "Stress condition"
        case .vintage: return "More vintage feel"
        }
    }
}

struct AdvicePhoto: Identifiable {
    let id: String
    let label: String
    let hint: String
}

struct PlatformReasoning {
    let good: String
    let bad: String
    let time: String
    let views: String
}

// MARK: - Mock data (matches prototype)

enum MockData {
    static let photos: [PhotoRef] = [
        .init(id: 1, label: "front",   hue: 168),
        .init(id: 2, label: "back",    hue: 172),
        .init(id: 3, label: "tag",     hue: 38),
        .init(id: 4, label: "detail",  hue: 154),
        .init(id: 5, label: "on-body", hue: 200),
    ]

    static let item = Item(
        title: "Carhartt Detroit Jacket",
        brand: "Carhartt",
        size: "M",
        condition: "Excellent",
        material: "Heavyweight cotton duck"
    )

    static let platforms: [Platform] = [
        .init(id: .vinted, name: "Vinted", audience: "Europe · resale-first",   feeLabel: "0%",     feePct: 0,     price: 38, sellRate: 76, color: Color(hex: 0x09B1BA)),
        .init(id: .depop,  name: "Depop",  audience: "Gen-Z · style-led",       feeLabel: "10%",    feePct: 10,    price: 42, sellRate: 62, color: Color(hex: 0xF00D2D)),
        .init(id: .ebay,   name: "eBay",   audience: "Global · all categories", feeLabel: "13.25%", feePct: 13.25, price: 48, sellRate: 71, color: Color(hex: 0x0064D2)),
    ]

    static let winnerID: PlatformID = .ebay

    static let baseCaptions: [PlatformID: Caption] = [
        .vinted: Caption(
            title: "Carhartt Detroit Jacket — Brown Duck Canvas — M",
            body: """
            Classic Carhartt Detroit chore jacket in brown duck canvas. Corduroy collar, blanket-lined body, two chest pockets. Excellent vintage condition — minor wear consistent with age, no rips or stains.

            Size M (fits true to size).
            Measurements: chest 23\", length 26\", sleeve 25\".

            From a smoke-free home. Bundle discounts available.
            """,
            tags: ["carhartt", "workwear", "vintage", "jacket", "mens", "unisex"],
            fields: [
                .init(label: "Category",    value: "Men > Clothing > Outerwear > Coats & jackets"),
                .init(label: "Brand",       value: "Carhartt"),
                .init(label: "Size",        value: "M"),
                .init(label: "Condition",   value: "Very good"),
                .init(label: "Colour",      value: "Brown"),
                .init(label: "Material",    value: "Cotton"),
                .init(label: "Parcel size", value: "Large", hint: "Coats and bulky items go in Large."),
            ]
        ),
        .depop: Caption(
            title: "carhartt detroit ✨ heavy duck canvas worker jacket",
            body: """
            vintage carhartt detroit jacket. fits like a dream, broken in just right. corduroy collar + blanket lining = built for cold weather. fits a M-L, looks unreal oversized on smaller frames.

            no flaws, no smells, ready to wear 🧡
            """,
            tags: ["carhartt", "detroit", "workwear", "vintage", "y2k", "menswear", "streetwear"],
            fields: [
                .init(label: "Department",   value: "Menswear"),
                .init(label: "Product type", value: "Jackets"),
                .init(label: "Brand",        value: "Carhartt"),
                .init(label: "Size",         value: "M"),
                .init(label: "Condition",    value: "Used – Excellent"),
                .init(label: "Colour",       value: "Brown"),
                .init(label: "Style",        value: "Workwear, Vintage"),
                .init(label: "Age",          value: "90s"),
                .init(label: "Source",       value: "Vintage"),
            ]
        ),
        .ebay: Caption(
            title: "Vintage Carhartt Detroit Jacket Brown Duck Canvas Blanket Lined Size Medium",
            body: """
            Vintage Carhartt Detroit jacket in classic brown duck canvas. Size Medium. Blanket-lined body for warmth, corduroy collar, classic Carhartt button placket and triple-stitched seams throughout.

            Condition: Pre-owned, excellent condition. Light fading consistent with age and use — no holes, tears, or stains. Lining intact. All buttons present and functional.

            Measurements taken flat:
            • Pit to pit: 23 in
            • Length (top of collar to hem): 26 in
            • Sleeve (shoulder seam to cuff): 25 in

            Ships from a smoke-free, pet-free home within 1 business day. Combined shipping available on multiple purchases.
            """,
            tags: [],
            fields: [
                .init(label: "Category",   value: "Clothes, Shoes & Accessories > Men > Men's Clothing > Coats, Jackets & Waistcoats"),
                .init(label: "Department", value: "Men"),
                .init(label: "Type",       value: "Denim Jacket"),
                .init(label: "Brand",      value: "Carhartt"),
                .init(label: "Size",       value: "M"),
                .init(label: "Size Type",  value: "Regular"),
                .init(label: "Style",      value: "Workwear, Vintage"),
                .init(label: "Colour",     value: "Brown"),
                .init(label: "Material",   value: "Cotton (heavyweight duck)"),
                .init(label: "Condition",  value: "Pre-owned – Excellent"),
            ]
        ),
    ]

    static let advicePhotos: [AdvicePhoto] = [
        .init(id: "back",  label: "Back of jacket",   hint: "Spot fading or print wear"),
        .init(id: "label", label: "Brand label",      hint: "Confirms era + authenticity"),
        .init(id: "tag",   label: "Inside care tag",  hint: "Fabric blend + wash info"),
    ]

    static let reasoning: [PlatformID: PlatformReasoning] = [
        .ebay:   .init(good: "Workwear sells well here — global reach and deeper buyer base for vintage Carhartt. Sellers move identical pieces fast.",
                       bad:  "Higher fees eat into your take, and casual buyers may scroll past.",
                       time: "6 days", views: "~140/wk"),
        .depop:  .init(good: "Vintage Carhartt is trending with the Gen-Z UK/US audience. Style-led photos earn a premium.",
                       bad:  "10% fee. Slower for plain workwear unless you have strong styling photos.",
                       time: "9 days", views: "~80/wk"),
        .vinted: .init(good: "Fast turnover, no seller fees, EU-wide buyer base. Lowest median price but quickest sell-through.",
                       bad:  "Median sale price runs ~15% below eBay. Less reach for menswear specifically.",
                       time: "4 days", views: "~110/wk"),
    ]

    static let historyItems: [(title: String, platform: String, price: Int, status: String, when: String)] = [
        ("Wrangler Denim Jacket",     "Vinted", 28,  "sold",   "2 days ago"),
        ("Champion Reverse Weave",    "Depop",  35,  "active", "5 days ago"),
        ("North Face Nuptse",         "eBay",   110, "active", "1 wk ago"),
        ("Levi's 501 Vintage",        "Vinted", 22,  "sold",   "2 wks ago"),
    ]
}

// MARK: - Caption refinement (ports rewriteCaption from listd-screens.jsx)

enum CaptionRewriter {
    static func apply(platform: PlatformID, base: Caption, chips: Set<FeedbackChip>) -> Caption {
        var title = base.title
        var body = base.body
        var tags = base.tags

        if chips.contains(.shorter) {
            body = body.components(separatedBy: "\n\n").first ?? body
            if body.count > 140 { body = String(body.prefix(137)) + "…" }
        }
        if chips.contains(.longer) {
            body += "\n\nGreat layering piece — works under a heavy overshirt in winter or solo in autumn. The duck canvas softens beautifully with wear. Buy with confidence."
        }
        if chips.contains(.casual), platform != .depop {
            body = body.replacingOccurrences(of: "Excellent vintage condition", with: "In great nick honestly")
                       .replacingOccurrences(of: "Ships from a smoke-free", with: "Ships fast from a smoke-free")
        }
        if chips.contains(.serious), platform == .depop {
            body = body.replacingOccurrences(of: "✨", with: "")
                       .replacingOccurrences(of: "🧡", with: "")
                       .replacingOccurrences(of: "built for cold weather.", with: "Built for cold weather.")
                       .replacingOccurrences(of: "fits like a dream, broken in just right.", with: "Worn-in fit, broken in nicely.")
            title = title.replacingOccurrences(of: " ✨", with: "")
        }
        if chips.contains(.measurements), !body.contains("Measurements") {
            body += "\n\nMeasurements: chest 23\", length 26\", sleeve 25\"."
        }
        if chips.contains(.hashtags) {
            for t in ["workwear", "vintage", "menswear", "carhartt"] where !tags.contains(t) {
                tags.append(t)
            }
        }
        if chips.contains(.condition) {
            // Best-effort regex replacement
            let pattern = #"Excellent vintage condition.*?stains\."#
            if let range = body.range(of: pattern, options: .regularExpression) {
                body.replaceSubrange(range, with: "Excellent vintage condition — gone over carefully, no rips, stains, smells or repairs. Lining fully intact.")
            }
        }
        if chips.contains(.vintage) {
            title = title.replacingOccurrences(of: "Carhartt Detroit Jacket", with: "90s Carhartt Detroit Jacket")
            body = "90s era — broken-in just right. " + body
        }
        return Caption(title: title, body: body, tags: tags)
    }
}

// MARK: - Color hex helper

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8)  & 0xFF) / 255
        let b = Double( hex        & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }
}
