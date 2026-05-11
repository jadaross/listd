import SwiftUI

// Warm direction (default per prototype tweaks) — electric blue accent
struct ListdTheme {
    let bg:     Color
    let card:   Color
    let text:   Color
    let muted:  Color
    let line:   Color
    let subtle: Color
    let accent: Color

    static let warm = ListdTheme(
        bg:     Color(hex: 0xF6F2EB),
        card:   .white,
        text:   Color(hex: 0x1C1A16),
        muted:  Color(hex: 0x86807A),
        line:   Color(hex: 0x1C1A16, opacity: 0.08),
        subtle: Color(hex: 0xEFEBE3),
        accent: Color(hex: 0x3B5CFF)
    )
}

// Font helpers — falls back to system serif (NewYork) until Instrument Serif is bundled.
// To use Instrument Serif: drop the TTF into the app target, list it in Info.plist
// under UIAppFonts, and set `useInstrumentSerif = true` below.
enum ListdFont {
    static let useInstrumentSerif = false

    /// Used for the "listd." wordmark and other expressive headlines
    static func serif(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        if useInstrumentSerif {
            return .custom("InstrumentSerif", size: size)
        }
        return .system(size: size, weight: weight, design: .serif)
    }

    /// SF Pro for body / UI text (the iOS-native pick)
    static func ui(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .default)
    }

    /// Monospaced for small uppercase eyebrow labels
    static func mono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }
}
