import SwiftUI
import UIKit

/// "Fields to pick on [Platform]" — list of platform-specific dropdowns the user
/// has to fill in, each with a Copy button. Mirrors web src/components/ui/PlatformFields.tsx.
struct PlatformFieldsCard: View {
    let platformName: String
    let fields: [ListingField]
    let theme: WattleTheme

    var body: some View {
        if fields.isEmpty {
            EmptyView()
        } else {
            VStack(alignment: .leading, spacing: 8) {
                Eyebrow(text: "Fields to pick on \(platformName)", color: theme.muted)
                VStack(spacing: 0) {
                    ForEach(Array(fields.enumerated()), id: \.offset) { i, f in
                        PlatformFieldRow(field: f, theme: theme)
                        if i < fields.count - 1 {
                            Divider().background(theme.line).padding(.leading, 16)
                        }
                    }
                }
                .background(theme.card, in: RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(theme.line, lineWidth: 0.5))
            }
            .padding(.horizontal, 22)
        }
    }
}

private struct PlatformFieldRow: View {
    let field: ListingField
    let theme: WattleTheme
    @State private var copied = false

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(field.label.uppercased())
                    .font(WattleFont.ui(10, weight: .semibold))
                    .tracking(0.9)
                    .foregroundStyle(theme.muted)
                Text(field.value)
                    .font(WattleFont.ui(14, weight: .medium))
                    .foregroundStyle(theme.text)
                    .fixedSize(horizontal: false, vertical: true)
                if let hint = field.hint {
                    Text(hint)
                        .font(WattleFont.ui(11))
                        .foregroundStyle(theme.muted)
                }
            }
            Spacer(minLength: 0)
            Button(action: copy) {
                HStack(spacing: 3) {
                    if copied {
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .bold))
                        Text("Copied")
                    } else {
                        Image(systemName: "doc.on.doc")
                            .font(.system(size: 10))
                        Text("Copy")
                    }
                }
                .font(WattleFont.ui(11, weight: .medium))
                .foregroundStyle(copied ? theme.accent : theme.muted)
                .padding(.horizontal, 6).padding(.vertical, 4)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
    }

    private func copy() {
        UIPasteboard.general.string = field.value
        copied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { copied = false }
    }
}
