import SwiftUI

@main
struct bowerApp: App {
    @State private var state: AppState

    init() {
        let session = SupabaseSession()
        _state = State(initialValue: AppState(session: session, api: BowerAPI(session: session)))
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(state)
        }
    }
}
