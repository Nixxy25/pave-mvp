'use client';

export function APICredentialsCard() {
  return (
    <div
      className="border bg-card p-4 shadow-sm animate-fadeup sm:p-6"
      style={{ animationDelay: '0.14s' }}
    >
      <h2 className="mb-4 font-serif text-lg font-light italic text-foreground">
        API Credentials
      </h2>

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4 text-muted-foreground">
          <path d="M8 24V16a16 16 0 0132 0v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="4" y="22" width="40" height="22" rx="4" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="24" cy="33" r="3" fill="currentColor" />
        </svg>
        <div className="text-lg font-medium text-foreground">Coming Soon</div>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          API access will be available soon. You&apos;ll be able to generate and manage your API keys here.
        </p>
      </div>
    </div>
  );
}
