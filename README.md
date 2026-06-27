# Pave

Global payment infrastructure with instant USDC settlement on Stellar blockchain.

## What is Pave?

Pave enables merchants to accept payments from customers worldwide and receive instant settlement in USDC stablecoin on the Stellar network. Customers can pay using traditional payment methods or directly with Stellar wallets, while merchants get their funds in seconds instead of days.

## Key Features

- **Hosted Checkout Pages** - Generate shareable payment links in seconds
- **Multi-Currency Support** - Accept payments in USD, NGN, GHS, and KES
- **Instant Settlement** - Receive USDC on Stellar with ~5 second finality
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
- **Live Exchange Rates** - Binance API for XLM rates, Open Exchange Rates for fiat

**Data & State Management**
- **React Query** - Server state management with caching
- **React Context** - Authentication and wallet state

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Privy account (for authentication)


## How It Works

**For Merchants**

1. Create a checkout link with amount and currency
2. Share the link with your customer
3. Receive instant USDC settlement when payment completes

**For Customers**

1. Open the checkout link
2. Choose payment method:
   - **Card Payment**
   - **Stellar Wallet** - Connect wallet and pay with XLM
3. Complete payment and get instant confirmation

**Payment Flow**

- All payments are verified on the Stellar blockchain
- Server-side amount validation prevents tampering
- Transaction hashes are checked to prevent reuse
- USDC settlement completes in ~5 seconds

## Security

Pave implements comprehensive security measures:

- **Server-Side Validation** - All payment amounts calculated and verified server-side
- **Blockchain Verification** - Every Stellar transaction verified on-chain before acceptance
- **Transaction Deduplication** - Database checks prevent transaction reuse
- **JWT Authentication** - Secure merchant authentication with Privy JWKS verification

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

