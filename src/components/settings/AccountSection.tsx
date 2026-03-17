// AccountSection — "Account" tab in SettingsPanel.
// Guest mode: shows sign-in buttons (grayed out / non-functional — auth is P1).

export default function AccountSection() {
  return (
    <div className="space-y-5">
      {/* Guest badge */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-lg">
            👤
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Guest Mode</p>
            <p className="text-xs text-slate-400">Settings saved on this device</p>
          </div>
          <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
            Guest
          </span>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          Sign in to sync your settings across devices and keep your child's
          progress safe.
        </p>
      </div>

      {/* Sign-in options — non-functional placeholder (auth is P1) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Sign in to unlock sync
        </p>

        {/* Apple */}
        <button
          disabled
          className="w-full flex items-center justify-center gap-3 py-3 px-4
                     rounded-xl border-2 border-slate-200 bg-slate-50
                     text-slate-400 font-semibold text-sm cursor-not-allowed
                     opacity-50"
        >
          <AppleIcon />
          Continue with Apple
        </button>

        {/* Google */}
        <button
          disabled
          className="w-full flex items-center justify-center gap-3 py-3 px-4
                     rounded-xl border-2 border-slate-200 bg-slate-50
                     text-slate-400 font-semibold text-sm cursor-not-allowed
                     opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="text-center text-xs text-slate-400 pt-1">
          Sign-in coming soon
        </p>
      </div>

      {/* Feature preview */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
        <p className="text-sm font-semibold text-blue-700 mb-2">
          What you get with an account
        </p>
        <ul className="space-y-1.5">
          {[
            'Sync settings across all your devices',
            'Create individual profiles per child',
            'Back up theme purchases automatically',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-sm text-blue-600">
              <span className="mt-0.5 text-blue-400">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline brand icons (minimal SVG — no external dependency)
// ---------------------------------------------------------------------------

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" opacity=".5"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" opacity=".5"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" opacity=".5"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" opacity=".5"/>
    </svg>
  )
}
