import SwiftUI

struct HomeView: View {
    @EnvironmentObject var state: AppState
    let theme: ListdTheme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                // Wordmark
                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .firstTextBaseline, spacing: 0) {
                        Text("listd")
                            .font(ListdFont.serif(56))
                            .foregroundStyle(theme.text)
                        Text(".")
                            .font(ListdFont.serif(56))
                            .foregroundStyle(theme.accent)
                    }
                    .padding(.top, 8)

                    Text("Snap your item — we'll write the listing and tell you where to post it.")
                        .font(ListdFont.ui(14))
                        .foregroundStyle(theme.muted)
                        .lineSpacing(2)
                        .frame(maxWidth: 280, alignment: .leading)
                }

                // Primary upload card
                VStack(spacing: 14) {
                    cameraIllo
                        .frame(maxWidth: .infinity)
                        .frame(height: 168)
                        .background(theme.subtle, in: RoundedRectangle(cornerRadius: 16))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .strokeBorder(theme.line, style: StrokeStyle(lineWidth: 1, dash: [4]))
                        )

                    HStack(spacing: 10) {
                        Button(action: state.startUpload) {
                            HStack(spacing: 8) {
                                Image(systemName: "camera")
                                Text("Camera")
                            }
                            .font(ListdFont.ui(15, weight: .semibold))
                            .foregroundStyle(theme.bg)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(theme.text, in: RoundedRectangle(cornerRadius: 14))
                        }
                        .buttonStyle(.plain)

                        Button(action: state.startUpload) {
                            HStack(spacing: 8) {
                                Image(systemName: "photo.on.rectangle")
                                Text("Library")
                            }
                            .font(ListdFont.ui(15, weight: .semibold))
                            .foregroundStyle(theme.text)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(theme.subtle, in: RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(theme.line, lineWidth: 0.5))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(18)
                .background(theme.card, in: RoundedRectangle(cornerRadius: 22))
                .overlay(RoundedRectangle(cornerRadius: 22).strokeBorder(theme.line, lineWidth: 0.5))
                .shadow(color: .black.opacity(0.04), radius: 30, y: 12)

                TipsCard(theme: theme)
            }
            .padding(.horizontal, 22)
            .padding(.top, 4)
            .padding(.bottom, 30)
        }
        .scrollIndicators(.hidden)
    }

    private var cameraIllo: some View {
        ZStack {
            // Body
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .strokeBorder(theme.muted.opacity(0.4), lineWidth: 1.5)
                .frame(width: 80, height: 58)
                .offset(y: 10)
            // Hump
            Path { p in
                p.move(to: .init(x: 24, y: 0))
                p.addLine(to: .init(x: 28, y: -6))
                p.addLine(to: .init(x: 52, y: -6))
                p.addLine(to: .init(x: 56, y: 0))
            }
            .stroke(theme.muted.opacity(0.4), lineWidth: 1.5)
            .offset(x: -40, y: -9)
            // Outer lens
            Circle()
                .strokeBorder(theme.muted.opacity(0.4), lineWidth: 1.5)
                .frame(width: 32, height: 32)
                .offset(y: 10)
            // Inner lens
            Circle()
                .fill(theme.accent)
                .frame(width: 18, height: 18)
                .offset(y: 10)
            // Flash dot
            Circle()
                .fill(theme.muted.opacity(0.5))
                .frame(width: 5, height: 5)
                .offset(x: 26, y: -8)
        }
        .frame(width: 120, height: 120)
    }
}
