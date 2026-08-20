import SwiftUI

/// Striped placeholder tile that mirrors the prototype's SVG hue/stripes pattern.
struct PhotoTile: View {
    let photo: PhotoRef
    var cornerRadius: CGFloat = 12
    var showLabel: Bool = true

    var body: some View {
        let bg = Color(hue: photo.hue / 360, saturation: 0.18, brightness: 0.78)
        let stripe = Color(hue: photo.hue / 360, saturation: 0.22, brightness: 0.56).opacity(0.25)
        let labelTone = Color(hue: photo.hue / 360, saturation: 0.30, brightness: 0.28)

        ZStack(alignment: .bottomLeading) {
            bg
            StripePattern(stripe: stripe)
            if showLabel {
                Text(photo.label.uppercased())
                    .font(WattleFont.mono(9, weight: .regular))
                    .tracking(0.7)
                    .foregroundStyle(labelTone)
                    .padding(.horizontal, 6).padding(.vertical, 2)
                    .background(Color.white.opacity(0.55), in: RoundedRectangle(cornerRadius: 4))
                    .padding(8)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }
}

private struct StripePattern: View {
    let stripe: Color

    var body: some View {
        GeometryReader { geo in
            Canvas { ctx, size in
                let step: CGFloat = 6
                let diag = sqrt(size.width * size.width + size.height * size.height)
                ctx.translateBy(x: size.width / 2, y: size.height / 2)
                ctx.rotate(by: .degrees(45))
                ctx.translateBy(x: -diag / 2, y: -diag / 2)
                var x: CGFloat = 0
                while x < diag {
                    let r = CGRect(x: x, y: 0, width: 2, height: diag)
                    ctx.fill(Path(r), with: .color(stripe))
                    x += step
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        .allowsHitTesting(false)
    }
}
