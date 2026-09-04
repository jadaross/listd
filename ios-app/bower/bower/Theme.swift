import SwiftUI

extension Color {
    /// `Color(hex: 0x2B3AA8)` — the palette is written in hex everywhere else,
    /// so it is written in hex here too rather than translated into components.
    init(hex: UInt32, opacity: Double = 1) {
        self.init(
            .sRGB,
            red:   Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >>  8) & 0xFF) / 255,
            blue:  Double( hex        & 0xFF) / 255,
            opacity: opacity
        )
    }
}

/// The palette. Surfaces change between light and dark; the accents do not.
struct BowerTheme {
    // Surfaces — these differ per appearance.
    let bg: Color
    let card: Color
    let subtle: Color
    let line: Color
    let text: Color
    let muted: Color
    let chrome: Color

    // Accents — shared by both appearances. See CLAUDE.md.
    let satin  = Color(hex: 0x2B3AA8)   // primary: buttons, links, selection
    let sheen  = Color(hex: 0x7BA9E8)   // progress and fills on dark
    let shell  = Color(hex: 0xDCE3F0)   // pale blue ground
    let coral  = Color(hex: 0xE1563C)   // the wordmark's stop, errors, "guess"
    let pollen = Color(hex: 0xE8B547)   // the mark's dot, warnings
    let moss   = Color(hex: 0x3F6B4A)   // confirmed, copied, evidence
    let ink    = Color(hex: 0x1B1A20)
    let avenue = Color(hex: 0x171A2E)   // full-bleed dark screens

    static let light = BowerTheme(
        bg:     Color(hex: 0xFBF7EF),
        card:   Color(hex: 0xFFFDF8),
        subtle: Color(hex: 0xF1EADC),
        line:   Color(hex: 0xE5DECE),
        text:   Color(hex: 0x1B1A20),
        muted:  Color(hex: 0x86807A),
        chrome: Color(hex: 0xFBF7EF, opacity: 0.86)
    )

    static let dark = BowerTheme(
        bg:     Color(hex: 0x131521),
        card:   Color(hex: 0x1C1F30),
        subtle: Color(hex: 0x232739),
        line:   Color(hex: 0x2E3348),
        text:   Color(hex: 0xF2EEE6),
        muted:  Color(hex: 0x8D93A8),
        chrome: Color(hex: 0x131521, opacity: 0.86)
    )

    static func of(_ scheme: ColorScheme) -> BowerTheme {
        scheme == .dark ? .dark : .light
    }
}

/// Instrument Serif and Geist are not bundled yet — `Font.custom` falls back to
/// the system face silently when a name is missing, which is the behaviour we
/// want until the `.ttf` files are added. Shape and scale still read correctly.
enum BowerFont {
    static func serif(_ size: CGFloat) -> Font {
        .custom("InstrumentSerif-Italic", size: size)
    }

    static func serifUpright(_ size: CGFloat) -> Font {
        .custom("InstrumentSerif-Regular", size: size)
    }

    static func ui(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("Geist-Regular", size: size).weight(weight)
    }

    static func mono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("GeistMono-Regular", size: size).weight(weight)
    }
}

private struct BowerThemeKey: EnvironmentKey {
    static let defaultValue = BowerTheme.light
}

extension EnvironmentValues {
    var bower: BowerTheme {
        get { self[BowerThemeKey.self] }
        set { self[BowerThemeKey.self] = newValue }
    }
}
