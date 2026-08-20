import SwiftUI

struct ConfirmView: View {
    @EnvironmentObject var state: AppState
    let theme: WattleTheme

    private let cols = Array(repeating: GridItem(.flexible(), spacing: 8), count: 3)
    private var photos: [PhotoRef] { MockData.photos }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("\(photos.count) photo\(photos.count != 1 ? "s" : "") selected")
                    .font(WattleFont.ui(24, weight: .semibold))
                    .foregroundStyle(theme.text)

                LazyVGrid(columns: cols, spacing: 8) {
                    ForEach(photos.prefix(6)) { p in
                        PhotoTile(photo: p)
                            .aspectRatio(1, contentMode: .fit)
                    }
                }

                Button(action: state.generate) {
                    HStack(spacing: 8) {
                        Text("Generate listings")
                        Image(systemName: "arrow.right")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .font(WattleFont.ui(16, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(theme.accent, in: RoundedRectangle(cornerRadius: 16))
                    .shadow(color: theme.accent.opacity(0.2), radius: 18, y: 8)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 22)
            .padding(.top, 4)
            .padding(.bottom, 30)
        }
        .scrollIndicators(.hidden)
    }
}
