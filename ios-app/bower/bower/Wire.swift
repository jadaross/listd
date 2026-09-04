import Foundation

// Codable mirrors of `src/lib/types.ts`. The backend mixes conventions —
// `photo_analysis` is snake_case, `perPlatform` is camelCase — but snake_case
// conversion handles both, because a key with no underscores passes through
// unchanged. Keep this file in step with types.ts.

enum WireCondition: String, Codable, Sendable {
    case newWithTags = "New with tags"
    case excellent   = "Excellent"
    case good        = "Good"
    case fair        = "Fair"
}

enum Confidence: String, Codable, Sendable {
    case low, medium, high
}

// MARK: - analyse

struct PhotoScore: Codable, Sendable {
    let index: Int
    let shotType: String
    let qualityScore: Double
    let issues: [String]
    let isUsable: Bool
}

struct PhotoAnalysis: Codable, Sendable {
    let scores: [PhotoScore]
    let missingShots: [String]
    let suggestions: [String]
    let hasTagPhoto: Bool
    let readyToList: Bool
}

struct TagData: Codable, Sendable {
    let brand: String?
    let size: String?
    let sizeSystem: String?
    let fabricComposition: String?
    let countryOfManufacture: String?
    let careInstructions: String?
    let rnNumber: String?
    let styleNumber: String?
    let barcodeVisible: Bool
}

/// The Neutral Listing — the platform-agnostic description every platform's
/// wording is generated from. See CONTEXT.md.
struct NeutralListing: Codable, Sendable {
    var brand: String
    var clothingType: String
    var colourPrimary: String
    var colourSecondary: String?
    var condition: WireCondition
    var size: String
    var material: String
    var title: String
    var description: String
    var hashtags: [String]
    /// The search-free guess, from the photos alone. One range, no platform
    /// breakdown, no comparables. Never present it as researched — ADR-0005.
    var priceMin: Double
    var priceMax: Double
    var priceReasoning: String
    var gender: String?
    var mainCategory: String?
    var subcategory: String?
}

struct AnalysisResult: Codable, Sendable {
    let photoAnalysis: PhotoAnalysis
    let tagData: TagData
    let listing: NeutralListing
}

// MARK: - format / refine

struct ListingField: Codable, Sendable, Identifiable {
    var id: String { label }
    let label: String
    let value: String
    let hint: String?
}

/// A Neutral Listing rewritten in one platform's voice.
struct PlatformListing: Codable, Sendable {
    var title: String
    var description: String
    var hashtags: [String]
    var fields: [ListingField]?
}

// MARK: - valuate

/// Named `ComparableListing` rather than `Comparable`: the wire name collides
/// with Swift's own `Comparable` protocol, and shadowing that would be a trap
/// for anyone who later tries to sort these.
struct ComparableListing: Codable, Sendable, Identifiable {
    var id: String { title + String(price) }
    let title: String
    /// What the seller is asking today — never what anything sold for.
    let price: Double
    let currency: String
    let platform: String
    let url: String?
}

/// A low-to-high range for one platform. Never collapse this to one number.
struct PriceBand: Codable, Sendable {
    let low: Double
    let high: Double
    let currency: String
    let confidence: Confidence
    let sellLikelihood: Confidence
    let comparables: [ComparableListing]
    /// Shown verbatim. Says "listed at", never "sells for".
    let reasoning: String
}

struct RunnerUp: Codable, Sendable {
    let platform: Platform
    let listAt: Double
    let net: Double
}

/// Only present with more than one Enabled Platform, and only once a real
/// search has produced comparables. Never earned by the guess.
struct Recommendation: Codable, Sendable {
    let platform: Platform
    let listAt: Double
    let net: Double
    let currency: String
    let reasoning: String
    let runnersUp: [RunnerUp]
}

struct AllowanceState: Codable, Sendable, Equatable {
    let used: Int
    let limit: Int
    let resetsAt: String?

    var remaining: Int { max(0, limit - used) }
}

struct ValuationResponse: Codable, Sendable {
    let perPlatform: [String: PriceBand]
    let query: String
    let recommendation: Recommendation?
    let allowance: AllowanceState?
}

/// Deliberately narrower than the Neutral Listing — a valuation needs less
/// than a listing does.
struct ValuationItem: Codable, Sendable {
    let brand: String
    let clothingType: String
    let size: String
    let condition: WireCondition
    let colourPrimary: String?
    let material: String?

    init(from listing: NeutralListing) {
        brand = listing.brand
        clothingType = listing.clothingType
        size = listing.size
        condition = listing.condition
        colourPrimary = listing.colourPrimary
        material = listing.material
    }
}

// MARK: - profile

struct ProfileResponse: Codable, Sendable {
    let enabledPlatforms: [Platform]
    let allowance: AllowanceState
}
