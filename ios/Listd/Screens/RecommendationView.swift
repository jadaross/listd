import SwiftUI

struct RecommendationView: View {
    @EnvironmentObject var state: AppState
    let theme: ListdTheme

    @State private var selectedID: PlatformID = MockData.winnerID

    private var ranked: [Platform] {
        MockData.platforms.sorted { $0.net > $1.net }
    }
    private var winner: Platform { ranked.first! }
    private var selected: Platform { ranked.first { $0.id == selectedID } ?? winner }
    private var alternatives: [Platform] { ranked.filter { $0.id != selectedID } }
    private var isWinner: Bool { selected.id == winner.id }
    private var reasoning: PlatformReasoning { MockData.reasoning[selected.id]! }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                backPill
                headline
                heroCard
                if !isWinner { tradeOff }
                Eyebrow(text: "Compare alternatives", color: theme.muted).padding(.top, 2)
                alternativesList
                openInAppButton
            }
            .padding(.horizontal, 22)
            .padding(.top, 4)
            .padding(.bottom, 30)
        }
        .scrollIndicators(.hidden)
        .onAppear { selectedID = state.winnerID }
    }

    // MARK: - Top "Back to listing" pill (matches the prototype's visible affordance)

    private var backPill: some View {
        Button { state.screen = .results } label: {
            HStack(spacing: 6) {
                Image(systemName: "chevron.left").font(.system(size: 11, weight: .semibold))
                Text("Back to listing")
            }
            .font(ListdFont.ui(13, weight: .medium))
            .foregroundStyle(theme.text)
            .padding(.horizontal, 13).padding(.vertical, 7)
            .background(theme.subtle, in: Capsule())
            .overlay(Capsule().strokeBorder(theme.line, lineWidth: 0.5))
        }
        .buttonStyle(.plain)
    }

    // MARK: - Headline

    private var headline: some View {
        VStack(alignment: .leading, spacing: 4) {
            Eyebrow(text: "Based on 247 live listings · updated 2m ago", color: theme.muted, mono: true)
            (
                isWinner
                ? Text("Post on ").foregroundStyle(theme.text) + Text(selected.name).foregroundStyle(selected.color) + Text(".").foregroundStyle(theme.text)
                : Text("How ").foregroundStyle(theme.text) + Text(selected.name).foregroundStyle(selected.color) + Text(" compares.").foregroundStyle(theme.text)
            )
            .font(ListdFont.serif(38))
            .lineSpacing(2)
            Text(reasoning.good)
                .font(ListdFont.ui(14))
                .foregroundStyle(theme.muted)
                .lineSpacing(2)
                .frame(maxWidth: 320, alignment: .leading)
        }
    }

    // MARK: - Hero payout card

    private var heroCard: some View {
        ZStack(alignment: .topTrailing) {
            // background circle decoration
            Circle()
                .fill(.white.opacity(0.1))
                .frame(width: 160, height: 160)
                .offset(x: 40, y: -40)
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .top) {
                    Eyebrow(text: isWinner ? "Best estimated payout" : "Estimated payout",
                            color: .white.opacity(0.85), mono: true)
                    Spacer()
                    if isWinner {
                        HStack(spacing: 4) {
                            StarShape().fill(.white).frame(width: 9, height: 9)
                            Text("Best")
                                .font(ListdFont.ui(10, weight: .bold))
                                .tracking(0.6)
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(.white.opacity(0.18), in: RoundedRectangle(cornerRadius: 6))
                    }
                }

                HStack(alignment: .lastTextBaseline, spacing: 8) {
                    Text("£\(Int(selected.net.rounded()))")
                        .font(.system(size: 48, weight: .bold))
                    Text("after \(selected.feeLabel) fees")
                        .font(ListdFont.ui(14))
                        .opacity(0.8)
                }
                .foregroundStyle(.white)

                Rectangle().fill(.white.opacity(0.2)).frame(height: 1)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                    StatBlock(label: "List price",   value: "£\(Int(selected.price))", dark: true, theme: theme)
                    StatBlock(label: "Sell-through", value: "\(selected.sellRate)%",   dark: true, theme: theme)
                    StatBlock(label: "Median time",  value: reasoning.time,            dark: true, theme: theme)
                    StatBlock(label: "Views/wk",     value: reasoning.views,           dark: true, theme: theme)
                }
            }
            .padding(22)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(selected.color, in: RoundedRectangle(cornerRadius: 22))
        .clipShape(RoundedRectangle(cornerRadius: 22))
        .shadow(color: selected.color.opacity(0.2), radius: 30, y: 16)
        .animation(.easeInOut(duration: 0.3), value: selected.id)
    }

    // MARK: - Trade-off caveat for non-winners

    private var tradeOff: some View {
        HStack(alignment: .top, spacing: 10) {
            ZStack {
                Circle().fill(theme.muted.opacity(0.13)).frame(width: 18, height: 18)
                Text("!")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(theme.muted)
            }
            Group {
                Text("Trade-off: ").font(ListdFont.ui(12, weight: .semibold)).foregroundStyle(theme.text)
                + Text(reasoning.bad).font(ListdFont.ui(12)).foregroundStyle(theme.muted)
            }
            .lineSpacing(1)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .background(theme.subtle, in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(theme.line, lineWidth: 0.5))
    }

    // MARK: - Alternatives

    private var alternativesList: some View {
        VStack(spacing: 10) {
            ForEach(alternatives) { p in
                Button {
                    withAnimation(.snappy(duration: 0.25)) { selectedID = p.id }
                } label: {
                    HStack(spacing: 14) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(p.color)
                            .frame(width: 8, height: 38)
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text(p.name)
                                    .font(ListdFont.ui(14, weight: .semibold))
                                    .foregroundStyle(theme.text)
                                if p.id == winner.id {
                                    StarShape().fill(winner.color).frame(width: 11, height: 11)
                                }
                            }
                            Text(p.audience)
                                .font(ListdFont.ui(12))
                                .foregroundStyle(theme.muted)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("£\(Int(p.net.rounded()))")
                                .font(ListdFont.ui(16, weight: .semibold))
                                .foregroundStyle(theme.text)
                            HStack(spacing: 3) {
                                Text("\(p.sellRate)% sells")
                                Image(systemName: "chevron.right").font(.system(size: 8, weight: .semibold))
                            }
                            .font(ListdFont.ui(11))
                            .foregroundStyle(theme.muted)
                        }
                    }
                    .padding(.horizontal, 16).padding(.vertical, 14)
                    .background(theme.card, in: RoundedRectangle(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(theme.line, lineWidth: 0.5))
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Open in app (placeholder — would be a deep link in production)

    private var openInAppButton: some View {
        Button {
            // Placeholder — wire to URL scheme / Universal Link
        } label: {
            HStack(spacing: 8) {
                Text("Open \(selected.name) app")
                Image(systemName: "arrow.up.right")
                    .font(.system(size: 13, weight: .semibold))
            }
            .font(ListdFont.ui(15, weight: .semibold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(selected.color, in: RoundedRectangle(cornerRadius: 14))
            .shadow(color: selected.color.opacity(0.27), radius: 18, y: 8)
        }
        .buttonStyle(.plain)
        .padding(.top, 4)
    }
}
