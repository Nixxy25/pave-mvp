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
    "acceptedCurrencies": ["Card", "USDC", "Bank Transfer"]
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
      "email": "john@example.com"
    },
    "stellarTxHash": "abc123...xyz789",
    "status": "completed",
    "completedAt": "2026-04-13T10:35:12Z"
  }
}`;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 pb-20 sm:px-7 sm:py-8">
      <div className="mb-6 animate-fadeup">
        <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          API & Webhooks
        </div>
        <h1 className="font-serif text-[24px] font-light italic leading-tight tracking-tight text-foreground sm:text-[27px]">
          Developer Documentation
        </h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Integrate Pave payments into your application
        </p>
        <div className="mt-3 border-l-2 border-[var(--pave-orange)] bg-[var(--pave-orange)]/5 px-3 py-2 text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">Note:</span> This is demo documentation meant as an overview, and will be updated.
        </div>
      </div>

      <div className="grid gap-6">
        {/* Create Payment */}
        <div className="border bg-card p-4 shadow-sm animate-fadeup sm:p-6" style={{ animationDelay: '0.07s' }}>
          <h2 className="mb-2 font-serif text-lg font-light italic text-foreground">
            Create a Payment
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            POST /v1/payments
          </p>
          
          <div className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Request</div>
          <pre className="overflow-x-auto bg-gray-900 p-3 text-xs text-gray-100 sm:p-4">
            <code>{curlExample}</code>
          </pre>
          
          <div className="mb-3 mt-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Response</div>
          <pre className="overflow-x-auto bg-gray-900 p-3 text-xs text-gray-100 sm:p-4">
            <code>{responseExample}</code>
          </pre>
        </div>

        {/* Webhooks */}
        <div className="border bg-card p-6 shadow-sm animate-fadeup" style={{ animationDelay: '0.14s' }}>
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
          <pre className="overflow-x-auto bg-gray-900 p-4 text-xs text-gray-100">
            <code>{webhookExample}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
