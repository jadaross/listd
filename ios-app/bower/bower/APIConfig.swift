import Foundation

/// Where the backend lives. Read from the bundle rather than written into the
/// source, so Debug and Release can differ and a future domain change is a
/// build-setting edit. It is not a live switch — changing it still needs a new
/// build. See issue #23.
enum APIConfig {
    static let baseURL: URL = {
        let raw = Bundle.main.object(forInfoDictionaryKey: "BowerAPIBaseURL") as? String
        guard let raw, !raw.isEmpty, let url = URL(string: raw) else {
            preconditionFailure(
                "BowerAPIBaseURL is missing or malformed. It comes from the BOWER_API_BASE_URL "
                + "build setting — check both configurations in the project's build settings."
            )
        }
        return url
    }()
}
