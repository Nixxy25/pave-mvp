'use client';

export default function APIWebhooksPage() {
  const curlExample = `curl https://api.pave.finance/v1/payments \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "NGN",
    "description": "Premium subscription",
    "settlementAsset": "USDC",
    "acceptedCurrencies": ["Mobile Money", "Card", "USDC"]
  }'`;

  const responseExample = `{
  "id": "pay_abc123xyz",
  "checkoutUrl": "https://checkout.pave.finance/pay_abc123xyz",
  "amount": 50000,
  "currency": "NGN",
  "status": "pending",
  "createdAt": "2026-04-13T10:30:00Z",
  "expiresAt": "2026-04-14T10:30:00Z"
}`;

  const webhookExample = `{
  "event": "payment.completed",
  "data": {
    "id": "pay_abc123xyz",
    "amount": 50000,
    "currency": "NGN",
    "usdcAmount": 35.21,
    "payer": {
      "name": "John Doe",
      "email": "john@example.com",
      "country": "NG"
    },
    "stellarTxHash": "abc123...xyz789",
    "status": "completed",
    "completedAt": "2026-04-13T10:35:12Z"
  }
}`;

  return (
    <div className="mx-auto max-w-[1200px] px-7 py-8 pb-20">
      <div className="mb-6 animate-fadeup">
        <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          API & Webhooks
        </div>
        <h1 className="font-serif text-[27px] font-light italic leading-tight tracking-tight text-foreground">
          Developer Documentation
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Integrate Pave payments into your application
        </p>
      </div>

      <div className="grid gap-6">
        {/* Create Payment */}
        <div className="rounded-[14px] border bg-card p-6 shadow-sm animate-fadeup" style={{ animationDelay: '0.07s' }}>
          <h2 className="mb-2 font-serif text-lg font-light italic text-foreground">
            Create a Payment
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            POST /v1/payments
          </p>
          
          <div className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Request</div>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
            <code>{curlExample}</code>
          </pre>
          
          <div className="mb-3 mt-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Response</div>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
            <code>{responseExample}</code>
          </pre>
        </div>

        {/* Webhooks */}
        <div className="rounded-[14px] border bg-card p-6 shadow-sm animate-fadeup" style={{ animationDelay: '0.14s' }}>
          <h2 className="mb-2 font-serif text-lg font-light italic text-foreground">
            Webhook Events
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Receive real-time notifications when payments are completed
          </p>
          
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">payment.completed</code>
              <span className="text-muted-foreground">Payment successfully received</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">payment.failed</code>
              <span className="text-muted-foreground">Payment attempt failed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <code className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">withdrawal.completed</code>
              <span className="text-muted-foreground">Withdrawal processed</span>
            </div>
          </div>
          
          <div className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Example Payload</div>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
            <code>{webhookExample}</code>
          </pre>
        </div>

        {/* SDK Links */}
        <div className="rounded-[14px] border bg-card p-6 shadow-sm animate-fadeup" style={{ animationDelay: '0.21s' }}>
          <h2 className="mb-2 font-serif text-lg font-light italic text-foreground\">
            Official SDKs
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Use our official libraries for faster integration
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-4 text-center">
              <div className="mb-2 text-2xl">🟦</div>
              <div className="font-medium text-foreground">Node.js</div>
              <div className="mt-1 text-xs text-muted-foreground">npm i @pave/node</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="mb-2 text-2xl">🐍</div>
              <div className="font-medium text-foreground">Python</div>
              <div className="mt-1 text-xs text-muted-foreground">pip install pave</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="mb-2 text-2xl">🟩</div>
              <div className="font-medium text-foreground">Go</div>
              <div className="mt-1 text-xs text-muted-foreground">go get pave.finance/sdk</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
