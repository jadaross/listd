import SwiftUI
import UIKit

// MARK: - Eyebrow label (uppercase, tracked)

struct Eyebrow: View {
    let text: String
    var color: Color
    var mono: Bool = false

    var body: some View {
        Text(text.uppercased())
            .font(mono
                  ? ListdFont.mono(11, weight: .regular)
                  : ListdFont.ui(11, weight: .semibold))
            .tracking(mono ? 1.1 : 0.9)
            .foregroundStyle(color)
    }
}

// MARK: - Spinner

struct ListdSpinner: View {
    var color: Color
    var size: CGFloat = 14
    @State private var rotation: Double = 0

    var body: some View {
        Circle()
            .trim(from: 0, to: 0.25)
            .stroke(color, style: StrokeStyle(lineWidth: 1.5, lineCap: .round))
            .frame(width: size, height: size)
            .overlay(
                Circle()
                    .stroke(color.opacity(0.2), lineWidth: 1.5)
                    .frame(width: size, height: size)
            )
            .rotationEffect(.degrees(rotation))
            .onAppear {
                withAnimation(.linear(duration: 0.8).repeatForever(autoreverses: false)) {
                    rotation = 360
                }
            }
    }
}

// MARK: - Star icon (used on winner pill / recommendation card)

struct StarShape: Shape {
    func path(in rect: CGRect) -> Path {
        // 5-point star, matches the design's points
        let cx = rect.midX
        let cy = rect.midY
        let outer = min(rect.width, rect.height) / 2
        let inner = outer * 0.4
        var path = Path()
        for i in 0..<10 {
            let r = i.isMultiple(of: 2) ? outer : inner
            let angle = (Double(i) * .pi / 5) - .pi / 2
            let x = cx + r * cos(angle)
            let y = cy + r * sin(angle)
            if i == 0 { path.move(to: .init(x: x, y: y)) }
            else      { path.addLine(to: .init(x: x, y: y)) }
        }
        path.closeSubpath()
        return path
    }
}

// MARK: - Copy button (sets clipboard, shows ✓ briefly)

struct CopyButton: View {
    let text: String
    var theme: ListdTheme
    var compact: Bool = true

    @State private var copied = false

    var body: some View {
        Button(action: copy) {
            HStack(spacing: 3) {
                if copied {
                    Image(systemName: "checkmark")
                        .font(.system(size: 10, weight: .semibold))
                    Text("Copied")
                } else {
                    Image(systemName: "doc.on.doc")
                        .font(.system(size: 10, weight: .regular))
                    Text("Copy")
                }
            }
            .font(ListdFont.ui(11, weight: .medium))
            .foregroundStyle(copied ? theme.accent : theme.muted)
            .padding(.horizontal, 6).padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }

    private func copy() {
        UIPasteboard.general.string = text
        copied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { copied = false }
    }
}

// MARK: - "Copy all" pill on caption card

struct CopyAllButton: View {
    let text: String
    var theme: ListdTheme

    @State private var copied = false

    var body: some View {
        Button(action: copy) {
            HStack(spacing: 5) {
                Image(systemName: "doc.on.doc")
                    .font(.system(size: 12))
                Text(copied ? "Copied all" : "Copy all")
            }
            .font(ListdFont.ui(12, weight: .semibold))
            .foregroundStyle(copied ? .white : theme.text)
            .padding(.horizontal, 12).padding(.vertical, 7)
            .background(copied ? theme.accent : theme.subtle, in: RoundedRectangle(cornerRadius: 9))
        }
        .buttonStyle(.plain)
    }

    private func copy() {
        UIPasteboard.general.string = text
        copied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.4) { copied = false }
    }
}

// MARK: - Stat block (used in payout card + history strip)

struct StatBlock: View {
    let label: String
    let value: String
    var dark: Bool = false
    var theme: ListdTheme

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased())
                .font(ListdFont.ui(10, weight: .medium))
                .tracking(0.8)
                .foregroundStyle(dark ? .white.opacity(0.75) : theme.muted)
            Text(value)
                .font(ListdFont.ui(14, weight: .semibold))
                .monospacedDigit()
                .foregroundStyle(dark ? .white : theme.text)
        }
    }
}

// MARK: - Tips card (home screen)

struct TipsCard: View {
    let theme: ListdTheme

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(theme.accent)
                .frame(width: 28, height: 28)
                .overlay(
                    Image(systemName: "sparkles")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white)
                )
            (Text("4+ photos works best. ").font(ListdFont.ui(13, weight: .semibold)).foregroundColor(theme.text)
             + Text("Include the brand tag — we'll auto-detect size, fabric and era.")
                .font(ListdFont.ui(13)).foregroundColor(theme.muted))
            .lineSpacing(1)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 16).padding(.vertical, 14)
        .background(theme.subtle, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(theme.line, lineWidth: 0.5))
    }
}

// MARK: - Field row (Title / Description / Tags) with Edit + Copy + optional inline editor

struct FieldRow<ValueView: View>: View {
    let label: String
    let value: String
    let theme: ListdTheme
    var isEditable: Bool = true
    var multiline: Bool = false
    @Binding var editing: Bool
    var onCommit: (String) -> Void
    @ViewBuilder var content: () -> ValueView

    @State private var draft: String = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Eyebrow(text: label, color: theme.muted)
                Spacer()
                HStack(spacing: 4) {
                    if isEditable && !editing {
                        Button {
                            draft = value
                            withAnimation(.snappy(duration: 0.18)) { editing = true }
                        } label: {
                            HStack(spacing: 3) {
                                Image(systemName: "pencil")
                                    .font(.system(size: 10, weight: .medium))
                                Text("Edit")
                            }
                            .font(ListdFont.ui(11, weight: .medium))
                            .foregroundStyle(theme.muted)
                            .padding(.horizontal, 6).padding(.vertical, 4)
                        }
                        .buttonStyle(.plain)
                    }
                    if !editing {
                        CopyButton(text: value, theme: theme)
                    }
                }
            }

            if editing {
                VStack(alignment: .trailing, spacing: 8) {
                    if multiline {
                        TextEditor(text: $draft)
                            .font(ListdFont.ui(14))
                            .frame(minHeight: 120)
                            .padding(8)
                            .background(theme.bg)
                            .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(theme.accent, lineWidth: 1.5))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .scrollContentBackground(.hidden)
                    } else {
                        TextField("", text: $draft, axis: .horizontal)
                            .font(ListdFont.ui(16, weight: .semibold))
                            .padding(.horizontal, 12).padding(.vertical, 10)
                            .background(theme.bg)
                            .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(theme.accent, lineWidth: 1.5))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    HStack(spacing: 8) {
                        Button("Cancel") {
                            withAnimation(.snappy(duration: 0.18)) { editing = false }
                        }
                        .buttonStyle(.plain)
                        .font(ListdFont.ui(13, weight: .medium))
                        .foregroundStyle(theme.text)
                        .padding(.horizontal, 14).padding(.vertical, 7)
                        .background(theme.subtle, in: RoundedRectangle(cornerRadius: 8))

                        Button("Save") {
                            onCommit(draft)
                            withAnimation(.snappy(duration: 0.18)) { editing = false }
                        }
                        .buttonStyle(.plain)
                        .font(ListdFont.ui(13, weight: .semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14).padding(.vertical, 7)
                        .background(theme.accent, in: RoundedRectangle(cornerRadius: 8))
                    }
                }
                .onAppear { draft = value }
            } else {
                content()
            }
        }
    }
}
