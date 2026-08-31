import SwiftUI

struct HistoryView: View {
    let theme: BowerTheme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                // Stats card
                HStack(spacing: 8) {
                    StatBlock(label: "Listed", value: "12",   theme: theme)
                    Spacer()
                    StatBlock(label: "Sold",   value: "7",    theme: theme)
                    Spacer()
                    StatBlock(label: "Earned", value: "£284", theme: theme)
                }
                .padding(16)
                .background(theme.card, in: RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(theme.line, lineWidth: 0.5))

                // Items
                VStack(spacing: 8) {
                    ForEach(Array(MockData.historyItems.enumerated()), id: \.offset) { idx, it in
                        HStack(spacing: 12) {
                            PhotoTile(photo: MockData.photos[idx % MockData.photos.count], cornerRadius: 9, showLabel: false)
                                .frame(width: 44, height: 44)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(it.title)
                                    .font(BowerFont.ui(14, weight: .medium))
                                    .foregroundStyle(theme.text)
                                Text("\(it.platform) · \(it.when)")
                                    .font(BowerFont.ui(12))
                                    .foregroundStyle(theme.muted)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("£\(it.price)")
                                    .font(BowerFont.ui(14, weight: .semibold))
                                    .foregroundStyle(theme.text)
                                Text(it.status.uppercased())
                                    .font(BowerFont.ui(10, weight: .semibold))
                                    .tracking(0.7)
                                    .foregroundStyle(it.status == "sold"
                                                     ? Color(hex: 0x1F8A5B)
                                                     : theme.muted)
                            }
                        }
                        .padding(.horizontal, 14).padding(.vertical, 12)
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
}
