import Foundation

/// Where the backend and the identity provider live. Read from the bundle
/// rather than written into source, so Debug and Release can differ and a
/// future change is a build-setting edit. Not a live switch — it still needs
/// a new build. See issue #23.
enum APIConfig {
    static let baseURL: URL = url("BowerAPIBaseURL", setting: "BOWER_API_BASE_URL")
    static let supabaseURL: URL = url("BowerSupabaseURL", setting: "BOWER_SUPABASE_URL")

    /// The anon key is designed to ship in clients — row-level security is what
    /// protects the data, not the key's secrecy. See ADR-0006.
    static let supabaseAnonKey: String = string("BowerSupabaseAnonKey", setting: "BOWER_SUPABASE_ANON_KEY")

    private static func string(_ key: String, setting: String) -> String {
        let raw = Bundle.main.object(forInfoDictionaryKey: key) as? String
        guard let raw, !raw.isEmpty, !raw.hasPrefix("$(") else {
            preconditionFailure("\(key) is missing from Info.plist — it comes from the \(setting) build setting.")
        }
        return raw
    }

    private static func url(_ key: String, setting: String) -> URL {
        guard let url = URL(string: string(key, setting: setting)) else {
            preconditionFailure("\(key) is not a valid URL — check the \(setting) build setting.")
        }
        return url
    }
}
