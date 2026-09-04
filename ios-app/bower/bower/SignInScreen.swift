import SwiftUI
import AuthenticationServices

struct SignInScreen: View {
    @Environment(AppState.self) private var state
    @Environment(\.bower) private var theme
    @Environment(\.colorScheme) private var scheme

    @State private var email = ""
    @State private var password = ""
    @State private var working = false
    @State private var rejected = false

    /// Remembered so a returning user is led to the method they actually use.
    /// Also the cheap guard against signing in a second way and quietly ending
    /// up with two accounts — see issue #30.
    @AppStorage("lastSignInMethod") private var lastMethod = "apple"

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 24)

            VStack(spacing: 16) {
                Arch(size: 92)
                VStack(spacing: 7) {
                    HStack(spacing: 0) {
                        Text("bower").foregroundStyle(theme.text)
                        Text(".").foregroundStyle(theme.coral)
                    }
                    .font(BowerFont.serif(58))

                    Text("Shiny things, arranged nicely.")
                        .font(BowerFont.ui(13.5))
                        .foregroundStyle(theme.muted)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 210)
                }
            }

            Spacer(minLength: 28)

            VStack(spacing: 10) {
                appleButton
                divider
                field("Email", text: $email, secure: false)
                field("Password", text: $password, secure: true)
                if rejected { rejection }

                BowerButton(title: working ? "Signing in…" : "Sign in", disabled: working) {
                    signInWithEmail()
                }

                HStack(spacing: 4) {
                    Text("New here?").foregroundStyle(theme.muted)
                    Button("Create an account") { finish(via: "email") }
                        .buttonStyle(.plain)
                        .foregroundStyle(theme.satin)
                        .fontWeight(.medium)
                }
                .font(BowerFont.ui(13))
                .padding(.top, 2)
            }
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 34)
    }

    private var appleButton: some View {
        SignInWithAppleButton(.signIn) { request in
            request.requestedScopes = [.fullName, .email]
        } onCompletion: { _ in
            finish(via: "apple")
        }
        .signInWithAppleButtonStyle(scheme == .dark ? .white : .black)
        .frame(height: 50)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(alignment: .topTrailing) {
            if lastMethod == "apple" {
                Text("You used this last time")
                    .font(BowerFont.mono(9.5, weight: .bold))
                    .tracking(0.6)
                    .foregroundStyle(theme.ink)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(theme.pollen)
                    .clipShape(RoundedRectangle(cornerRadius: 5))
                    .offset(x: -10, y: -9)
            }
        }
    }

    private var divider: some View {
        HStack(spacing: 10) {
            Hairline()
            Kicker("or")
            Hairline()
        }
        .padding(.vertical, 4)
    }

    private func field(_ placeholder: String, text: Binding<String>, secure: Bool) -> some View {
        Group {
            if secure {
                SecureField(placeholder, text: text)
            } else {
                TextField(placeholder, text: text)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
            }
        }
        .textFieldStyle(.plain)
        .font(BowerFont.ui(15))
        .padding(.vertical, 13)
        .padding(.horizontal, 14)
        .background(theme.card)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(rejected ? theme.coral : theme.line, lineWidth: 1)
        )
    }

    private var rejection: some View {
        HStack(alignment: .top, spacing: 8) {
            Text("!")
                .font(BowerFont.ui(11, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 16, height: 16)
                .background(theme.coral)
                .clipShape(Circle())
            Text(rejectionText).font(BowerFont.ui(12.5))
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 12)
        .background(theme.coral.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private var rejectionText: AttributedString {
        var lead = AttributedString("That password doesn't match this email. ")
        lead.foregroundColor = theme.text
        var tail = AttributedString("The account exists — try again or reset it.")
        tail.foregroundColor = theme.muted
        return lead + tail
    }

    private func signInWithEmail() {
        guard password.count >= 4 else { rejected = true; return }
        rejected = false
        working = true
        finish(via: "email")
    }

    private func finish(via method: String) {
        lastMethod = method
        working = false
        state.screen = .platforms
    }
}
