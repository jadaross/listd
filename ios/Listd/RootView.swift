import SwiftUI

struct RootView: View {
    @EnvironmentObject var state: AppState
    private let theme = ListdTheme.warm

    var body: some View {
        ZStack(alignment: .bottom) {
            theme.bg.ignoresSafeArea()

            VStack(spacing: 0) {
                header
                content
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .padding(.bottom, 78) // tab bar reservation
            .transition(.opacity)

            if !hideTabBar {
                ListdTabBar(screen: $state.screen, theme: theme)
                    .transition(.move(edge: .bottom))
            }
        }
        .animation(.snappy(duration: 0.22), value: state.screen)
    }

    // Header is contextual to the screen
    @ViewBuilder private var header: some View {
        switch state.screen {
        case .home, .history, .settings:
            HStack {
                Button { /* leading menu placeholder */ } label: {
                    Image(systemName: "")
                }.opacity(0).frame(width: 60)
                Spacer()
                Text(headerTitle)
                    .font(headerTitle == "listd" ? ListdFont.serif(22) : ListdFont.ui(17, weight: .semibold))
                    .foregroundStyle(theme.text)
                Spacer()
                Color.clear.frame(width: 60)
            }
            .frame(minHeight: 40)
            .padding(.horizontal, 18)
            .padding(.top, 6).padding(.bottom, 4)

        case .confirm, .results, .recommendation:
            HStack {
                Button(action: back) {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 16, weight: .semibold))
                        if let lbl = backLabel { Text(lbl) }
                    }
                    .font(ListdFont.ui(16, weight: .medium))
                    .foregroundStyle(theme.accent)
                }
                .buttonStyle(.plain)
                .frame(width: 80, alignment: .leading)
                Spacer()
                Text(headerTitle)
                    .font(ListdFont.ui(17, weight: .semibold))
                    .foregroundStyle(theme.text)
                Spacer()
                trailing
                    .frame(width: 80, alignment: .trailing)
            }
            .frame(minHeight: 40)
            .padding(.horizontal, 18)
            .padding(.top, 6).padding(.bottom, 4)

        case .generating:
            // No header — full-bleed loading screen
            EmptyView()
        }
    }

    private var headerTitle: String {
        switch state.screen {
        case .home:           return "listd"
        case .confirm:        return "New listing"
        case .generating:     return ""
        case .results:        return "Listings"
        case .recommendation: return "Where to post"
        case .history:        return "Your listings"
        case .settings:       return "Settings"
        }
    }

    private var backLabel: String? {
        if case .recommendation = state.screen { return "Listing" }
        return nil
    }

    @ViewBuilder private var trailing: some View {
        if case .results = state.screen {
            Button(action: state.newListing) {
                Text("New")
                    .font(ListdFont.ui(15, weight: .medium))
                    .foregroundStyle(theme.accent)
            }
            .buttonStyle(.plain)
        } else {
            EmptyView()
        }
    }

    private func back() {
        switch state.screen {
        case .confirm:        state.screen = .home
        case .results:        state.screen = .home
        case .recommendation: state.screen = .results
        default: break
        }
    }

    private var hideTabBar: Bool {
        if case .generating = state.screen { return true }
        return false
    }

    @ViewBuilder private var content: some View {
        switch state.screen {
        case .home:           HomeView(theme: theme)
        case .confirm:        ConfirmView(theme: theme)
        case .generating:     GeneratingView(theme: theme)
        case .results:        ResultsView(theme: theme)
        case .recommendation: RecommendationView(theme: theme)
        case .history:        HistoryView(theme: theme)
        case .settings:       SettingsView(theme: theme)
        }
    }
}
