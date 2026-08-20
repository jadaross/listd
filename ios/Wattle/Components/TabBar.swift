import SwiftUI

struct WattleTabBar: View {
    enum Tab: String { case new, listings, you }
    @Binding var screen: Screen
    let theme: WattleTheme

    private var activeTab: Tab {
        switch screen {
        case .home, .confirm, .generating, .results, .recommendation: return .new
        case .history: return .listings
        case .settings: return .you
        }
    }

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            tabButton(.new,      "New",      iconNew)
            tabButton(.listings, "Listings", iconStack)
            tabButton(.you,      "You",      iconPerson)
        }
        .padding(.top, 8)
        .padding(.bottom, 18)
        .frame(height: 78)
        .background(
            theme.bg.opacity(0.9)
                .background(.ultraThinMaterial)
        )
        .overlay(
            Rectangle()
                .fill(theme.line)
                .frame(height: 0.5),
            alignment: .top
        )
    }

    private func tabButton(_ tab: Tab, _ label: String, _ icon: AnyView) -> some View {
        Button {
            switch tab {
            case .new:      if screen != .home { screen = .home }
            case .listings: screen = .history
            case .you:      screen = .settings
            }
        } label: {
            VStack(spacing: 3) {
                icon
                Text(label).font(WattleFont.ui(10, weight: .medium))
            }
            .foregroundStyle(activeTab == tab ? theme.accent : theme.muted)
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }

    private var iconNew: AnyView {
        AnyView(
            ZStack {
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .strokeBorder(lineWidth: 1.8)
                    .frame(width: 22, height: 22)
                Image(systemName: "plus")
                    .font(.system(size: 12, weight: .bold))
            }
            .frame(width: 26, height: 26)
        )
    }

    private var iconStack: AnyView {
        AnyView(
            Image(systemName: "rectangle.stack")
                .font(.system(size: 18, weight: .regular))
                .frame(width: 26, height: 26)
        )
    }

    private var iconPerson: AnyView {
        AnyView(
            Image(systemName: "person.crop.circle")
                .font(.system(size: 20, weight: .regular))
                .frame(width: 26, height: 26)
        )
    }
}
