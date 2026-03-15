import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isLoading } = useAuth();

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div
        className="flex flex-col items-center gap-8 p-10 rounded-2xl w-full max-w-sm"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
            style={{ background: 'var(--accent)' }}
          >
            SB
          </div>
          <span className="text-xl font-semibold tracking-tight">StudioBase</span>
          <span className="text-sm text-center" style={{ color: 'var(--text2)' }}>
            Melde dich an, um fortzufahren.
          </span>
        </div>

        {/* Login button */}
        <button
          onClick={login}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          Mit Keycloak anmelden
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--text2)' }}>
          Single Sign-On via Keycloak
        </p>
      </div>
    </div>
  );
}
