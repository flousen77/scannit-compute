export default async function InternalLoginPage({ searchParams }) {
  const { next = '/internal/earnings', error } = await searchParams;

  return (
    <div className="bg-[#050508] text-white min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="bg-brand-panel border border-white/10 rounded-2xl p-8 backdrop-blur">
          <h1 className="text-xl font-semibold mb-1">Internal Access</h1>
          <p className="text-sm text-[#94a3b8] mb-6">
            Enter the shared password to continue.
          </p>

          <form method="POST" action="/api/internal/auth/login" className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <input
              type="password"
              name="password"
              autoFocus
              required
              placeholder="Password"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-[#94a3b8]/60 focus:outline-none focus:border-[#06b6d4] transition-colors"
            />

            {error && (
              <p className="text-sm text-red-400">Incorrect password. Try again.</p>
            )}

            <button
              type="submit"
              className="w-full bg-white text-[#050508] rounded-lg py-3 font-semibold hover:bg-[#06b6d4] hover:text-white transition-colors"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
