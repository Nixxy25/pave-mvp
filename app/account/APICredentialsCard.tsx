'use client';

interface APICredentialsCardProps {
  apiKey?: string;
  secretKey?: string;
}

export function APICredentialsCard({ apiKey, secretKey }: APICredentialsCardProps) {
  return (
    <div
      className="rounded-[14px] border bg-card p-4 shadow-sm animate-fadeup sm:p-6"
      style={{ animationDelay: '0.14s' }}
    >
      <h2 className="mb-4 font-serif text-lg font-light italic text-foreground">
        API Credentials
      </h2>

      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">Public Key</div>
            {apiKey && (
              <button
                onClick={() => navigator.clipboard.writeText(apiKey)}
                className="text-xs text-[var(--pave-orange)] hover:underline"
              >
                Copy
              </button>
            )}
          </div>
          <div className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground sm:text-sm">
            {apiKey ?? '—'}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">Secret Key</div>
            {secretKey && (
              <button
                onClick={() => navigator.clipboard.writeText(secretKey)}
                className="text-xs text-[var(--pave-orange)] hover:underline"
              >
                Copy
              </button>
            )}
          </div>
          <div className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground sm:text-sm">
            {secretKey ?? '—'}
          </div>
          <div className="mt-1 text-xs text-foreground">
            Keep this secret! Never share or commit to version control
          </div>
        </div>
      </div>
    </div>
  );
}
