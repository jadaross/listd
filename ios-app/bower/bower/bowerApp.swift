import SwiftUI

@main
struct bowerApp: App {
    @State private var state: AppState

    init() {
        #if DEBUG
        // `-bowerStub` as a launch argument runs the whole app against fixture
        // data with no network and no sign-in. For driving screens in the
        // simulator and for demos; the flag does not exist in Release builds.
        if CommandLine.arguments.contains("-bowerStub") {
            let s = AppState(session: SupabaseSession(), api: StubAPI())
            s.screen = .capture
            _state = State(initialValue: s)
            return
        }
        #endif
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
