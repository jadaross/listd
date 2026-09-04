import Foundation

/// The failures the backend actually distinguishes, kept distinct here because
/// the client has to react differently to each. `src/lib/auth.ts` explains why:
/// a missing token means "never signed in", an expired one means "refresh and
/// retry, invisibly", and a rejected one means the stored session is corrupt
/// and the honest move is to sign out.
enum APIError: Error, Sendable {
    case notSignedIn
    case sessionExpired
    case sessionInvalid
    /// A real, designed state with its own screen — not an error to apologise for.
    case allowanceExhausted(AllowanceState)
    case badRequest(String)
    case server(status: Int, message: String?)
    case transport(any Error)
    case decoding(any Error)

    /// Whether retrying after refreshing the session is worth attempting.
    var isRecoverableBySignInRefresh: Bool {
        if case .sessionExpired = self { return true }
        return false
    }
}

/// The error envelope every route shares.
struct APIErrorBody: Decodable, Sendable {
    let error: String?
    let code: String?
    let allowance: AllowanceState?
}
