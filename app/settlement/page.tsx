'use client';

export default function SettlementPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-7 py-8 pb-20">
      <div className="mb-6 animate-fadeup">
        <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          Settlement
        </div>
        <h1 className="font-serif text-[27px] font-light italic leading-tight tracking-tight text-foreground">
          Atomic Payment Settlement
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Stellar path payment — one transaction, no partial failures
        </p>
      </div>

      {/* Settlement Visualization */}
      <div className="rounded-[14px] border bg-card p-8 shadow-sm animate-fadeup" style={{ animationDelay: '0.07s' }}>
        <div className="mb-6 text-center">
          <h2 className="font-serif text-xl font-light italic text-foreground">
            How Pave Settles Payments
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Using Stellar's atomic swaps for guaranteed settlement
          </p>
        </div>

        {/* Path Flow */}
        <div className="flex items-center justify-between">
          {/* Source */}
          <div className="flex-1 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="font-medium text-foreground">Customer Pays</div>
            <div className="mt-1 text-sm text-muted-foreground">NGN / KES / GHS</div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 px-4">
            <svg className="h-6 w-12 text-muted-foreground" fill="none" viewBox="0 0 48 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h44M42 6l6 6-6 6" />
            </svg>
          </div>

          {/* Bridge */}
          <div className="flex-1 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="font-medium text-foreground">Stellar Swap</div>
            <div className="mt-1 text-sm text-muted-foreground">Instant conversion</div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 px-4">
            <svg className="h-6 w-12 text-muted-foreground" fill="none" viewBox="0 0 48 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h44M42 6l6 6-6 6" />
            </svg>
          </div>

          {/* Destination */}
          <div className="flex-1 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="font-medium text-foreground">You Receive</div>
            <div className="mt-1 text-sm text-muted-foreground">USDC on Stellar</div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 border-t pt-6">
          <div className="text-center">
            <div className="font-serif text-2xl font-light italic text-foreground">~3s</div>
            <div className="mt-1 text-sm text-muted-foreground">Average settlement time</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-2xl font-light italic text-foreground">100%</div>
            <div className="mt-1 text-sm text-muted-foreground">Atomic guarantee</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-2xl font-light italic text-foreground">$0.001</div>
            <div className="mt-1 text-sm text-muted-foreground">Network fee</div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-5 animate-fadeup" style={{ animationDelay: '0.14s' }}>
          <div className="mb-2 text-sm font-medium text-foreground">✓ No Partial Failures</div>
          <p className="text-sm text-muted-foreground">
            Either the entire payment succeeds or it's rolled back — no stuck funds
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5 animate-fadeup" style={{ animationDelay: '0.21s' }}>
          <div className="mb-2 text-sm font-medium text-foreground">✓ Real-time Settlement</div>
          <p className="text-sm text-muted-foreground">
            Funds arrive in your wallet within seconds, not days
          </p>
        </div>
      </div>
    </div>
  );
}
