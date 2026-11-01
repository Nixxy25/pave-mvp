# Pave

Merchants create USD checkout links and customers pay in **USDC on Stellar**, directly to the merchant's Turnkey-managed wallet. 0% commission. Bank settlement is coming soon.

Architecture, phases and the production runbook: [PAVE_ARCHITECTURE.md](./PAVE_ARCHITECTURE.md).

## Stack

Next.js 16, TypeScript, Tailwind 4, Privy (auth), Turnkey (wallets), QuickNode (payment detection), Supabase (data).

## Develop

```bash
npm install
npm run dev            # http://localhost:3001, reads .env.local (production Supabase, Stellar Testnet)
npm run test:payments
npx tsc --noEmit && npm run build
```

One git-ignored env file, `.env.local` (production Supabase, Stellar Testnet USDC). Test with a dedicated test merchant account.
