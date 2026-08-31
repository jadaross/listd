import SwiftUI

struct SettingsView: View {
    let theme: BowerTheme

    private struct Section { let title: String; let rows: [Row] }
    private struct Row { let label: String; let value: String }

    private var sections: [Section] {
        [
            Section(title: "Account", rows: [
                Row(label: "Connected platforms", value: "eBay"),
                Row(label: "Currency", value: "GBP"),
                Row(label: "Default tone", value: "Auto"),
            ]),
            Section(title: "Generation", rows: [
                Row(label: "Auto-add measurements", value: "On"),
                Row(label: "Include hashtags by default", value: "Depop only"),
                Row(label: "Photo coaching", value: "On"),
            ]),
        ]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                profile
                ForEach(sections, id: \.title) { section in
                    VStack(alignment: .leading, spacing: 8) {
                        Eyebrow(text: section.title, color: theme.muted)
                            .padding(.leading, 4)
                        VStack(spacing: 0) {
                            ForEach(Array(section.rows.enumerated()), id: \.offset) { i, r in
                                HStack {
                                    Text(r.label)
                                        .font(BowerFont.ui(14))
                                        .foregroundStyle(theme.text)
                                    Spacer()
                                    HStack(spacing: 6) {
                                        Text(r.value)
                                            .font(BowerFont.ui(14))
                                            .foregroundStyle(theme.muted)
                                        Image(systemName: "chevron.right")
                                            .font(.system(size: 10, weight: .semibold))
                                            .foregroundStyle(theme.muted)
                                    }
                                }
                                .padding(.horizontal, 16).padding(.vertical, 14)
                                if i < section.rows.count - 1 {
                                    Divider().background(theme.line).padding(.leading, 16)
                                }
                            }
                        }
                        .background(theme.card, in: RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(theme.line, lineWidth: 0.5))
                    }
                }
            }
            .padding(.horizontal, 22)
            .padding(.top, 4)
            .padding(.bottom, 30)
        }
        .scrollIndicators(.hidden)
    }

    private var profile: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle().fill(theme.accent.opacity(0.13))
                Text("EM")
                    .font(BowerFont.ui(20, weight: .semibold))
                    .foregroundStyle(theme.accent)
            }
            .frame(width: 52, height: 52)
            VStack(alignment: .leading, spacing: 2) {
                Text("Ellie M.")
                    .font(BowerFont.ui(17, weight: .semibold))
                    .foregroundStyle(theme.text)
                Text("bower Pro · 47 listings")
                    .font(BowerFont.ui(13))
                    .foregroundStyle(theme.muted)
            }
            Spacer()
        }
        .padding(.vertical, 4)
    }
}
