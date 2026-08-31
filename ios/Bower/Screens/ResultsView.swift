import SwiftUI

struct ResultsView: View {
    @EnvironmentObject var state: AppState
    let theme: BowerTheme

    @State private var photoSheet: AdvicePhoto? = nil
    @State private var capturing: CapturingState? = nil

    struct CapturingState: Identifiable {
        let id = UUID()
        let label: String
        let source: Source
        let adviceID: String
        enum Source { case camera, library }
    }

    private var caption: Caption { state.caption(for: state.activePlatform) }
    private var winner: Platform { MockData.platforms.first(where: { $0.id == state.winnerID })! }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                itemHero
                recommendationCTA
                platformPills
                boostAccuracy
                captionCard
                PlatformFieldsCard(
                    platformName: MockData.platforms.first(where: { $0.id == state.activePlatform })?.name ?? "",
                    fields: caption.fields,
                    theme: theme
                )
                feedbackChips
                newListingCTA
            }
            .padding(.top, 4)
            .padding(.bottom, 30)
        }
        .scrollIndicators(.hidden)
        .overlay(alignment: .bottom) {
            if let ap = photoSheet, capturing == nil {
                photoSourceSheet(for: ap)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .overlay {
            if let c = capturing { capturingOverlay(c) }
        }
        .animation(.snappy(duration: 0.22), value: photoSheet?.id)
        .animation(.snappy(duration: 0.22), value: capturing?.id)
    }

    // MARK: - Item hero strip

    private var itemHero: some View {
        HStack(spacing: 12) {
            PhotoTile(photo: MockData.photos[0])
                .frame(width: 56, height: 56)
            VStack(alignment: .leading, spacing: 2) {
                Text(MockData.item.title)
                    .font(BowerFont.ui(15, weight: .semibold))
                    .foregroundStyle(theme.text)
                    .lineLimit(1)
                Text("\(MockData.item.brand) · Size \(MockData.item.size) · \(MockData.item.condition)")
                    .font(BowerFont.ui(12))
                    .foregroundStyle(theme.muted)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 22)
    }

    // MARK: - Recommendation CTA

    private var recommendationCTA: some View {
        Button { state.screen = .recommendation } label: {
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous).fill(winner.color)
                    StarShape().fill(.white).frame(width: 16, height: 16)
                }
                .frame(width: 30, height: 30)

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Text("Best on ").foregroundStyle(theme.text)
                        + Text(winner.name).foregroundStyle(winner.color)
                    }
                    .font(BowerFont.ui(14, weight: .semibold))
                    Text("Tap to see why · 247 comps scanned")
                        .font(BowerFont.ui(12))
                        .foregroundStyle(theme.muted)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(theme.muted)
            }
            .padding(.horizontal, 16).padding(.vertical, 14)
            .background(theme.card, in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(winner.color.opacity(0.33), lineWidth: 1))
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 22)
    }

    // MARK: - Platform pills

    private var platformPills: some View {
        HStack(spacing: 8) {
            ForEach(MockData.platforms) { p in
                let active = p.id == state.activePlatform
                let isWinner = p.id == state.winnerID
                Button { state.activePlatform = p.id } label: {
                    HStack(spacing: 6) {
                        if isWinner {
                            StarShape().fill(p.color).frame(width: 11, height: 11)
                        } else {
                            Circle().fill(p.color).frame(width: 8, height: 8).opacity(active ? 1 : 0.85)
                        }
                        Text(p.name)
                    }
                    .font(BowerFont.ui(13, weight: .semibold))
                    .foregroundStyle(active ? theme.bg : theme.text)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(active ? theme.text : theme.subtle, in: RoundedRectangle(cornerRadius: 11))
                    .overlay(
                        active ? nil : RoundedRectangle(cornerRadius: 11).strokeBorder(theme.line, lineWidth: 0.5)
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 22)
    }

    // MARK: - Boost accuracy

    private var boostAccuracy: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Eyebrow(text: "Boost accuracy", color: theme.muted)
                Spacer()
                Text("\(MockData.advicePhotos.count - state.addedPhotos.count) suggested")
                    .font(BowerFont.ui(11))
                    .foregroundStyle(theme.muted)
            }
            HStack(spacing: 8) {
                ForEach(MockData.advicePhotos) { ap in
                    adviceCard(ap)
                }
            }
            if state.pendingAddedPhotoCount > 0 {
                Button(action: state.regenWithAddedPhotos) {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 12, weight: .semibold))
                        Text("Regenerate with new photo\(state.pendingAddedPhotoCount > 1 ? "s" : "")")
                    }
                    .font(BowerFont.ui(13, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 11)
                    .background(theme.accent, in: RoundedRectangle(cornerRadius: 11))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 22)
    }

    private func adviceCard(_ ap: AdvicePhoto) -> some View {
        let added = state.addedPhotos.contains { $0.id == ap.id }
        return Button {
            if !added { photoSheet = ap }
        } label: {
            VStack(alignment: .leading, spacing: 6) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(added ? Color(hex: 0x1E6B3A) : theme.accent.opacity(0.08))
                        .frame(width: 28, height: 28)
                    if added {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                    } else {
                        Image(systemName: "plus")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(theme.accent)
                    }
                }
                Text(ap.label)
                    .font(BowerFont.ui(12, weight: .semibold))
                    .foregroundStyle(theme.text)
                    .multilineTextAlignment(.leading)
                Text(ap.hint)
                    .font(BowerFont.ui(10))
                    .foregroundStyle(theme.muted)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 10).padding(.vertical, 12)
            .background(added ? theme.subtle : theme.card, in: RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(theme.line, style: StrokeStyle(lineWidth: added ? 0.5 : 1, dash: added ? [] : [4]))
            )
        }
        .buttonStyle(.plain)
        .disabled(added)
    }

    // MARK: - Caption card

    private var captionCard: some View {
        ZStack {
            VStack(alignment: .leading, spacing: 14) {
                titleRow
                Divider().background(theme.line)
                bodyRow
                if !caption.tags.isEmpty {
                    Divider().background(theme.line)
                    tagsRow
                }
                Divider().background(theme.line)
                metaRow
            }
            .padding(18)
            .background(theme.card, in: RoundedRectangle(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).strokeBorder(theme.line, lineWidth: 0.5))
            .opacity(state.regenerating ? 0.5 : 1)

            if state.regenerating {
                HStack(spacing: 8) {
                    BowerSpinner(color: theme.accent)
                    Text("Rewriting…")
                        .font(BowerFont.ui(12))
                        .foregroundStyle(theme.text)
                }
                .padding(.horizontal, 14).padding(.vertical, 8)
                .background(theme.card, in: Capsule())
                .overlay(Capsule().strokeBorder(theme.line, lineWidth: 0.5))
                .shadow(color: .black.opacity(0.06), radius: 12, y: 4)
            }
        }
        .padding(.horizontal, 22)
        .animation(.easeOut(duration: 0.18), value: state.regenerating)
    }

    private var titleRow: some View {
        FieldRow(
            label: "Title",
            value: caption.title,
            theme: theme,
            multiline: false,
            editing: editingBinding(.title),
            onCommit: { state.saveEdit(.title, $0) }
        ) {
            Text(caption.title)
                .font(BowerFont.ui(16, weight: .semibold))
                .foregroundStyle(theme.text)
                .lineSpacing(2)
        }
    }

    private var bodyRow: some View {
        FieldRow(
            label: "Description",
            value: caption.body,
            theme: theme,
            multiline: true,
            editing: editingBinding(.body),
            onCommit: { state.saveEdit(.body, $0) }
        ) {
            Text(caption.body)
                .font(BowerFont.ui(14))
                .foregroundStyle(theme.text)
                .lineSpacing(4)
        }
    }

    private var tagsRow: some View {
        FieldRow(
            label: state.activePlatform == .depop ? "Hashtags" : "Keywords",
            value: caption.tags.map { "#\($0)" }.joined(separator: " "),
            theme: theme,
            isEditable: false,
            multiline: false,
            editing: .constant(false),
            onCommit: { _ in }
        ) {
            FlowLayout(spacing: 6, runSpacing: 6) {
                ForEach(caption.tags, id: \.self) { tg in
                    Text("#\(tg)")
                        .font(BowerFont.mono(12))
                        .foregroundStyle(theme.text)
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(theme.subtle, in: RoundedRectangle(cornerRadius: 6))
                }
            }
        }
    }

    private var metaRow: some View {
        HStack {
            HStack(spacing: 8) {
                Image(systemName: "sparkles")
                    .font(.system(size: 11))
                    .foregroundStyle(theme.accent)
                Text("Generated in 1.4s · \(caption.body.count / 5) words")
                    .font(BowerFont.ui(12))
                    .foregroundStyle(theme.muted)
            }
            Spacer()
            let combined = caption.title + "\n\n" + caption.body +
                (caption.tags.isEmpty ? "" : "\n\n" + caption.tags.map { "#\($0)" }.joined(separator: " "))
            CopyAllButton(text: combined, theme: theme)
        }
    }

    private func editingBinding(_ field: AppState.EditField) -> Binding<Bool> {
        Binding(
            get: { state.editingField == field },
            set: { isOn in state.editingField = isOn ? field : nil }
        )
    }

    // MARK: - Feedback chips

    private var feedbackChips: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Eyebrow(text: "Not quite? Tap to refine", color: theme.muted)
                Spacer()
                if !state.chips.isEmpty {
                    Button("Reset", action: state.resetChips)
                        .buttonStyle(.plain)
                        .font(BowerFont.ui(12, weight: .medium))
                        .foregroundStyle(theme.accent)
                }
            }
            .padding(.horizontal, 22)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(FeedbackChip.allCases) { c in
                        let active = state.chips.contains(c)
                        Button { state.toggleChip(c) } label: {
                            HStack(spacing: 6) {
                                if active {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 10, weight: .bold))
                                }
                                Text(c.label)
                            }
                            .font(BowerFont.ui(13, weight: .medium))
                            .foregroundStyle(active ? .white : theme.text)
                            .padding(.horizontal, 14).padding(.vertical, 9)
                            .background(active ? theme.accent : theme.card, in: Capsule())
                            .overlay(active ? nil : Capsule().strokeBorder(theme.line, lineWidth: 0.5))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 22)
                .padding(.vertical, 2)
            }
        }
        .padding(.top, 6)
    }

    // MARK: - Start a new listing

    private var newListingCTA: some View {
        Button(action: state.newListing) {
            HStack(spacing: 8) {
                Image(systemName: "plus")
                    .font(.system(size: 14, weight: .bold))
                Text("Start a new listing")
            }
            .font(BowerFont.ui(14, weight: .semibold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(theme.accent, in: RoundedRectangle(cornerRadius: 14))
            .shadow(color: theme.accent.opacity(0.2), radius: 14, y: 6)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 22)
        .padding(.top, 6)
    }

    // MARK: - Photo source action sheet

    private func photoSourceSheet(for ap: AdvicePhoto) -> some View {
        ZStack(alignment: .bottom) {
            Color.black.opacity(0.4)
                .ignoresSafeArea()
                .onTapGesture { photoSheet = nil }

            VStack(spacing: 8) {
                VStack(spacing: 0) {
                    VStack(spacing: 2) {
                        Text(ap.label)
                            .font(BowerFont.ui(13, weight: .semibold))
                            .foregroundStyle(theme.text)
                        Text(ap.hint)
                            .font(BowerFont.ui(12))
                            .foregroundStyle(theme.muted)
                    }
                    .padding(.horizontal, 16).padding(.vertical, 13)
                    .frame(maxWidth: .infinity)
                    Divider().background(theme.line)
                    sheetButton("Take Photo")   { trigger(.camera,  for: ap) }
                    Divider().background(theme.line)
                    sheetButton("Choose from Library") { trigger(.library, for: ap) }
                }
                .background(theme.card, in: RoundedRectangle(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(theme.line, lineWidth: 0.5))

                Button("Cancel") { photoSheet = nil }
                    .buttonStyle(.plain)
                    .font(BowerFont.ui(15, weight: .semibold))
                    .foregroundStyle(theme.accent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(theme.card, in: RoundedRectangle(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).strokeBorder(theme.line, lineWidth: 0.5))
            }
            .padding(10)
        }
    }

    private func sheetButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(BowerFont.ui(15, weight: .medium))
                .foregroundStyle(theme.accent)
                .frame(maxWidth: .infinity)
                .padding(.horizontal, 16).padding(.vertical, 14)
        }
        .buttonStyle(.plain)
    }

    private func trigger(_ src: CapturingState.Source, for ap: AdvicePhoto) {
        capturing = CapturingState(label: ap.label, source: src, adviceID: ap.id)
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 1_300_000_000)
            state.queueAddedPhoto(ap.id)
            capturing = nil
            photoSheet = nil
        }
    }

    // MARK: - Capturing overlay

    private func capturingOverlay(_ c: CapturingState) -> some View {
        ZStack {
            (c.source == .camera ? Color.black : Color.black.opacity(0.7))
                .ignoresSafeArea()
            VStack(spacing: 18) {
                Text(c.source == .camera ? "CAPTURING" : "UPLOADING")
                    .font(BowerFont.mono(11))
                    .tracking(1.1)
                    .foregroundStyle(.white.opacity(0.6))
                Text(c.label)
                    .font(BowerFont.serif(22))
                    .foregroundStyle(.white)
                if c.source == .camera {
                    Circle()
                        .strokeBorder(.white, lineWidth: 3)
                        .frame(width: 64, height: 64)
                        .overlay(
                            Circle().fill(.white).frame(width: 50, height: 50)
                                .modifier(PulseShutter())
                        )
                } else {
                    ProgressView().tint(.white).scaleEffect(1.2)
                }
            }
        }
    }
}

private struct PulseShutter: ViewModifier {
    @State private var on = false
    func body(content: Content) -> some View {
        content
            .opacity(on ? 1 : 0.4)
            .animation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true), value: on)
            .onAppear { on = true }
    }
}

// MARK: - Tiny flow layout used for tag chips

struct FlowLayout: Layout {
    var spacing: CGFloat = 6
    var runSpacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        for sv in subviews {
            let s = sv.sizeThatFits(.unspecified)
            if x + s.width > maxWidth {
                x = 0
                y += rowHeight + runSpacing
                rowHeight = 0
            }
            x += s.width + spacing
            rowHeight = max(rowHeight, s.height)
        }
        return CGSize(width: maxWidth.isFinite ? maxWidth : x, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0
        for sv in subviews {
            let s = sv.sizeThatFits(.unspecified)
            if x + s.width > bounds.maxX {
                x = bounds.minX
                y += rowHeight + runSpacing
                rowHeight = 0
            }
            sv.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(s))
            x += s.width + spacing
            rowHeight = max(rowHeight, s.height)
        }
    }
}
