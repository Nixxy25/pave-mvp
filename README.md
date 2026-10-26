# Pave

Global payment infrastructure for merchants, customers, and Pave operations.

## What is Pave?

Pave enables merchants to create checkout links and accept customer payments. The current Stellar checkout uses Stellar testnet and sends native XLM directly to the merchant wallet. Payment records include a calculated USD/USDC equivalent; automatic on-chain USDC conversion and settlement are not implemented.

## Key Features

- **Hosted Checkout Pages** - Generate shareable payment links in seconds
- **Multi-Currency Support** - Accept payments in USD, NGN, GHS, and KES
- **Stellar Testnet Payments** - Accept direct XLM transfers to a merchant wallet
- **Flexible Payment Methods** - Cards and Stellar Wallet payments
- **Real-Time Dashboard** - Track payments, manage checkout links, and view analytics
- **Developer API** - RESTful API with webhooks for seamless integration

## Tech Stack

**Frontend & Framework**
- **Next.js 16** - React framework with App Router for server and client components
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Accessible component library built on Radix UI

**Backend & Infrastructure**
- **Supabase** - PostgreSQL database for checkout links, payments, and merchant data
- **Privy** - Authentication provider with JWKS token verification
- **Stellar SDK** - Blockchain integration for payment verification and settlement

**Payment & Settlement**
- **Stellar Network** - Testnet blockchain for USDC transfers
- **Stellar Wallets Kit** - Browser wallet integration (Freighter, Lobstr, etc.)
- **Live Exchange Rates** - CoinGecko API for XLM rates, Open Exchange Rates for fiat

**Data & State Management**
- **React Query** - Server state management with caching
- **React Context** - Authentication and wallet state

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Privy account (for authentication)


## Current Payment Flow

**For Merchants**

1. Create a checkout link with amount and currency
2. Share the link with your customer
3. Receive XLM directly in the configured Stellar wallet when payment completes

**For Customers**

1. Open the checkout link
2. Choose payment method:
   - **Card Payment** - Shown as coming soon and currently disabled
   - **Stellar Wallet** - Connect a Stellar wallet and pay with XLM on testnet
3. Approve the transaction in the wallet and receive a confirmation

**Payment Flow**

- The server verifies successful Stellar transactions, merchant destination, native XLM asset, and expected amount before recording a payment.
- Transaction hashes are checked to prevent reuse.
- The application currently uses the Stellar testnet; testnet funds are not real funds.

## Security

Pave implements comprehensive security measures:

- **Server-Side Validation** - All payment amounts calculated and verified server-side
- **Blockchain Verification** - Every Stellar transaction verified on-chain before acceptance
- **Transaction Deduplication** - Database checks prevent transaction reuse
- **JWT Authentication** - Secure merchant authentication with Privy JWKS verification

## Application Architecture

This repository is one Next.js application backed by one Supabase project (the hosted database is the source of truth; schema migrations are not managed here). The code is separated into three modules, each owning its UI, client API calls, and server logic, plus one shared payments module.

```
app/                      Routing only (thin pages and route files)
├── (public)/             Root route (redirects to /dashboard)
├── (merchant)/           Merchant dashboard pages  → /dashboard, /payments, /checkout-links, /account, ...
├── (customer)/           Guest checkout            → /checkout/[id], /confirmed/[id]
├── (admin)/admin/        Internal Admin pages      → /admin, /admin/login, /admin/[section]
├── api/                  One-line route files that re-export the server handlers below
├── providers.tsx         Global providers
└── layout.tsx

features/
├── merchant/             Merchant module
│   ├── auth/             Privy + merchant profile context
│   ├── api/              Browser → API calls (payments, links, stats, logs, user)
│   ├── hooks/            usePayments, useBalance, useCheckoutLinks
│   ├── components/       SignInButton, SignInPrompt
│   ├── layout/           Dashboard shell (topbar, sidebar, footer, notifications)
│   ├── lib/              Merchant-only helpers
│   └── server/           API handlers: merchant, stellar-wallet, checkout-links, payments
├── customer/             Customer (guest checkout) module
│   ├── api/              Browser → API calls (load link, complete payment)
│   ├── wallet/           Stellar wallet connection context
│   └── server/           API handlers: checkout (verify + record payment), payment confirmation
├── admin/                Admin module
│   ├── AdminShell.tsx, AdminLogin.tsx, navigation.ts
│   └── server/           API handlers: admin session
└── payments/             Shared payment logic used by more than one module
    ├── hooks/            useExchangeRates
    ├── mappers.ts        Database row → domain object mappers
    └── server/           Exchange rates (fiat + XLM) and its API handlers

lib/                      Cross-module infrastructure
├── auth/                 privy.ts (token verification), roles.ts (Admin allowlists), admin-session.ts
├── supabase/server.ts    The single server-only Supabase client
├── stellar/              Stellar transaction building and submission (no UI)
├── hooks/, fetch-api.ts, constants.ts, utils.ts
components/ui/            Shared design-system components
types/                    Shared TypeScript types
proxy.ts                  Hostname rewrite for admin.pavee.co
```

Dependency rules: a module may import from `lib/`, `components/ui/`, `types/`, and `features/payments/`, but not from another module (`merchant`, `customer`, `admin`). All database access goes through `lib/supabase/server.ts`, and only from `server/` folders.

API URLs are unchanged: for example `/api/checkout` is a one-line file in `app/api/checkout/route.ts` that re-exports `features/customer/server/checkout.ts`.
Admin access is fail-closed and based on Privy user IDs configured in server-only `PAVE_SUPER_ADMIN_USER_IDS` and `PAVE_ADMIN_USER_IDS` environment variables (comma-separated). `SUPER_ADMIN` takes precedence if an ID appears in both lists. Do not use `NEXT_PUBLIC_` variables for these IDs. A signed, expiring Privy token is stored in an HttpOnly cookie for protected Admin page requests. Future Admin route handlers must perform their own server-side role checks; future Server Actions should call `requireAdminSession()`.

Merchant requests continue using the existing Privy bearer-token verification and merchant ownership filters. The Supabase client uses the service-role key, which bypasses RLS, so every server handler must authenticate the caller and enforce ownership (merchants) or the Admin role (Admin) itself.

## Supabase

Supabase is the backend database. It is accessed only from server code through `lib/supabase/server.ts` using server-side environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). This repository does not manage database migrations; schema changes are made directly in the hosted project.
## Domains and Vercel Setup

The application is prepared to use one Vercel project for:

| Hostname | Purpose |
| --- | --- |
| `pavee.co` | Existing root behavior (currently redirects to `/dashboard`) |
| `merchant.pavee.co` | Merchant routes |
| `pay.pavee.co` | Guest checkout and confirmation routes |
| `admin.pavee.co` | Protected Admin routes |

Current route paths remain unchanged. On `admin.pavee.co`, `proxy.ts` maps `/` to the internal `/admin` route and maps other non-API paths under `/admin`. Merchant and customer paths are shared with their existing routes; no Vercel domain or DNS settings are changed by this code.

After assigning the domains to the same Vercel project, configure `PAVE_SUPER_ADMIN_USER_IDS` and `PAVE_ADMIN_USER_IDS` as server-side Vercel environment variables. Optionally set `NEXT_PUBLIC_PAY_BASE_URL=https://pay.pavee.co` so new checkout links use the customer hostname; until it is set, links use the current application origin. Keep `SUPABASE_SERVICE_ROLE_KEY` and other private credentials server-side.

## API Integration

Developers can integrate Pave programmatically:

```typescript
// Create a checkout link
POST /api/checkout-links
{
  "amount": 100,
  "currency": "USD",
  "description": "Product purchase",
  "acceptedCurrencies": ["USD", "NGN", "GHS"],
  "settlementAsset": "USDC"
}

// Response includes checkoutUrl to redirect customer
```

## License

MIT
