import SwiftUI

struct GeneratingView: View {
    let theme: ListdTheme

    @State private var activeStep: Int = 0
    @State private var rotation: Double = 0

    private let steps: [String] = [
        "Reading photos",
        "Detecting brand & size from tag",
        "Scanning comparable listings",
        "Writing captions for each platform",
    ]

    var body: some View {
        VStack(spacing: 26) {
            spinnerHero
            VStack(spacing: 14) {
                ForEach(0..<steps.count, id: \.self) { i in
                    stepRow(i)
                }
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(theme.card, in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(theme.line, lineWidth: 0.5))
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 28)
        .padding(.top, 40)
        .padding(.bottom, 30)
        .onAppear {
            withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                rotation = 360
            }
            for (i, _) in steps.enumerated() {
                let delay = Double(i) * 0.7
                Task { @MainActor in
                    try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                    activeStep = i
                }
            }
        }
    }

    private var spinnerHero: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle().strokeBorder(theme.line, lineWidth: 2)
                Circle()
                    .trim(from: 0, to: 0.25)
                    .stroke(theme.accent, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                    .rotationEffect(.degrees(rotation))
                Circle()
                    .fill(theme.accent.opacity(0.12))
                    .padding(18)
                Image(systemName: "sparkles")
                    .font(.system(size: 28))
                    .foregroundStyle(theme.accent)
            }
            .frame(width: 92, height: 92)

            Text("Reading your photos…")
                .font(ListdFont.serif(28))
                .foregroundStyle(theme.text)
                .padding(.top, 8)
            Text("Usually under 3 seconds. Don't close the app.")
                .font(ListdFont.ui(13))
                .foregroundStyle(theme.muted)
                .frame(maxWidth: 260)
                .multilineTextAlignment(.center)
        }
    }

    private func stepRow(_ i: Int) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .strokeBorder(i <= activeStep ? theme.accent : theme.line, lineWidth: 1.5)
                if i < activeStep {
                    Circle().fill(theme.accent)
                    Image(systemName: "checkmark")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(.white)
                } else if i == activeStep {
                    Circle().fill(theme.accent).frame(width: 6, height: 6)
                        .opacity(0.4)
                        .modifier(PulseOpacity())
                }
            }
            .frame(width: 18, height: 18)

            Text(steps[i])
                .font(ListdFont.ui(14, weight: i == activeStep ? .semibold : .regular))
                .foregroundStyle(i <= activeStep ? theme.text : theme.muted)
            Spacer()
        }
    }
}

private struct PulseOpacity: ViewModifier {
    @State private var on = false
    func body(content: Content) -> some View {
        content
            .opacity(on ? 1 : 0.4)
            .animation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: on)
            .onAppear { on = true }
    }
}
