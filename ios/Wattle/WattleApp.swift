import SwiftUI

// MARK: - Screen state machine

enum Screen: Hashable {
    case home, confirm, generating, results, recommendation
    case history, settings
}

@MainActor
final class AppState: ObservableObject {
    @Published var screen: Screen = .home
    @Published var activePlatform: PlatformID = .vinted
    @Published var chips: Set<FeedbackChip> = []
    @Published var regenerating: Bool = false
    @Published var editingField: EditField? = nil
    @Published var edits: [PlatformID: CaptionEdits] = [:]
    @Published var addedPhotos: [AddedPhoto] = []

    let winnerID: PlatformID = MockData.winnerID

    enum EditField { case title, body }

    struct CaptionEdits: Equatable {
        var title: String?
        var body:  String?
    }

    struct AddedPhoto: Identifiable, Equatable {
        let id: String   // matches AdvicePhoto.id
        var applied: Bool
    }

    var pendingAddedPhotoCount: Int {
        addedPhotos.filter { !$0.applied }.count
    }

    // Composed caption per platform — applies chips, then any manual edits.
    func caption(for platform: PlatformID) -> Caption {
        let base = MockData.baseCaptions[platform] ?? Caption(title: "", body: "", tags: [])
        var c = CaptionRewriter.apply(platform: platform, base: base, chips: chips)
        if let e = edits[platform] {
            if let t = e.title { c.title = t }
            if let b = e.body  { c.body  = b }
        }
        return c
    }

    // MARK: navigation

    func startUpload() {
        screen = .confirm
    }

    func generate() {
        screen = .generating
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 2_700_000_000)
            screen = .results
        }
    }

    func newListing() {
        screen = .home
        chips.removeAll()
        edits.removeAll()
        addedPhotos.removeAll()
        activePlatform = .vinted
        editingField = nil
    }

    // MARK: chips & edits

    func toggleChip(_ chip: FeedbackChip) {
        regenerating = true
        edits.removeAll() // refining clears manual edits (matches prototype)
        if chips.contains(chip) { chips.remove(chip) } else { chips.insert(chip) }
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 700_000_000)
            regenerating = false
        }
    }

    func resetChips() {
        regenerating = true
        chips.removeAll()
        edits.removeAll()
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 700_000_000)
            regenerating = false
        }
    }

    func saveEdit(_ field: EditField, _ value: String) {
        var e = edits[activePlatform] ?? CaptionEdits()
        switch field {
        case .title: e.title = value
        case .body:  e.body  = value
        }
        edits[activePlatform] = e
    }

    // MARK: boost accuracy

    func queueAddedPhoto(_ id: String) {
        guard !addedPhotos.contains(where: { $0.id == id }) else { return }
        addedPhotos.append(AddedPhoto(id: id, applied: false))
    }

    func regenWithAddedPhotos() {
        regenerating = true
        edits.removeAll()
        for i in addedPhotos.indices { addedPhotos[i].applied = true }
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 900_000_000)
            regenerating = false
        }
    }
}

// MARK: - App entry

@main
struct WattleApp: App {
    @StateObject private var state = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(state)
                .preferredColorScheme(.light)
        }
    }
}
