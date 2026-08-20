// Routes refuse to run without a key. Tests never make a live call — the
// Anthropic client is always mocked — but the guard still has to pass.
process.env.ANTHROPIC_API_KEY = "test-key-not-real";
