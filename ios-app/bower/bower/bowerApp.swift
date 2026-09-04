import SwiftUI

@main
struct bowerApp: App {
    @State private var state = AppState()
    @Environment(\.colorScheme) private var scheme

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(state)
        }
    }
}
