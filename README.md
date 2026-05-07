# Pave

Payment infrastructure for the modern internet. Accept payments globally with instant USDC settlement on the Stellar blockchain.

## Overview

Pave provides a complete payment solution for platforms and merchants:

- **Platforms and Apps** integrate Pave's API to generate hosted checkout pages
- **Customers** pay using cards or Stellar wallets
- **Merchants** receive instant settlement in USDC with ~5 second finality

## Features

**Checkout**
- Hosted checkout pages with shareable links
- Multi-currency support: USD, NGN, GHS, KES
- Payment methods: Cards (Visa, Mastercard), Stellar Wallet

**Settlement**
- Instant USDC settlement on Stellar blockchain
- Real-time balance tracking
- Bank withdrawals

**Dashboard**
- Payment history and analytics
- Checkout link management
- API request logging
- Webhook configuration

**Developer Experience**
- REST API for payment integration
- Webhooks for payment.completed, payment.failed, withdrawal.completed events
- API key management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI | shadcn/ui, Radix UI |
| Authentication | AWS Cognito (via Amplify) |
| Database | Supabase (PostgreSQL) |
| Blockchain | Stellar (USDC settlement) |
| Wallet | Stellar Wallets Kit |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- AWS Cognito User Pool
- Supabase project

### Environment Variables

Create a `.env.local` file in the project root:


### Installation

```bash
# Clone the repository
git clone https://github.com/Nixxy25/pave-mvp.git
cd pave-mvp

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3001) to view the application.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
pave-mvp/
├── app/
│   ├── (auth)/                 # Login, signup pages
│   ├── api/                    # API routes
│   │   ├── checkout/           # Public checkout completion
│   │   ├── checkout-links/     # Checkout link CRUD
│   │   └── payments/           # Payment queries
│   ├── checkout/[id]/          # Public checkout page
│   ├── confirmed/[id]/         # Payment confirmation
│   ├── dashboard/              # Merchant dashboard
│   ├── payments/               # Payment history
│   ├── checkout-links/         # Link management
│   ├── withdrawals/            # Withdrawal management
│   ├── account/                # Profile and API keys
│   ├── settings/               # Webhooks and preferences
│   ├── logs/                   # API request logs
│   └── api-webhooks/           # Developer documentation
├── components/
│   ├── ui/                     # shadcn/ui components
│   └── layout/                 # Dashboard layout
├── contexts/                   # React contexts (Auth, Wallet)
├── hooks/                      # Custom hooks
├── lib/
│   ├── api/                    # Domain API functions
│   ├── amplify-config.ts       # Cognito configuration
│   ├── supabase.ts             # Database client
│   ├── server-auth.ts          # JWT verification
│   └── constants.ts            # Currencies, rates
└── types/                      # TypeScript definitions
```

## Authentication

Pave supports two authentication methods:

1. **Email and Password** - Standard signup with email verification
2. **Google OAuth** - Sign in with Google (redirects to Cognito hosted UI)

New Google users are prompted to provide a business name on first login.

## Payment Flow

**Creating a Checkout Link**

1. Merchant creates a checkout link specifying amount, currency, description, and accepted currencies
2. Optionally, merchant can add their Stellar wallet address to receive payments directly
3. System calculates equivalent amounts in all accepted currencies using real-time conversion rates
4. Merchant shares the checkout URL with their customer

**Customer Payment**

1. Customer opens the checkout page and sees the amount in the merchant's currency plus equivalents in other accepted currencies
2. Customer selects their preferred payment method:
   - **Card**: Enter card details, payment is processed, and settled to merchant's Pave balance
   - **Stellar Wallet**: Connect wallet (Freighter, Lobstr, etc.), select currency to pay in, sign the XLM transaction, and submit to the Stellar network
3. For Stellar payments, if the merchant provided a wallet address on the checkout link, XLM is sent directly to that address. Otherwise, it settles to the merchant's Pave balance as USDC.
4. Customer is redirected to a confirmation page with transaction details

**Settlement**

- Card payments settle to the merchant's Pave balance
- Stellar payments with merchant wallet address go directly to that wallet
- Merchants can withdraw their Pave balance to a bank account

## API Integration

Platforms can integrate Pave to accept payments programmatically:

1. **Create Payment**: POST to `/v1/payments` with amount, currency, and accepted payment methods
2. **Redirect Customer**: Send customer to the returned `checkoutUrl`
3. **Receive Webhook**: Get notified at your webhook URL when payment completes
4. **Verify Payment**: Check payment status via GET `/v1/payments/{id}`

Webhook events:
- `payment.completed` - Payment successfully received
- `payment.failed` - Payment attempt failed
- `withdrawal.completed` - Withdrawal processed

## Supported Currencies

| Currency | Name |
|----------|------|
| USD | US Dollar |
| NGN | Nigerian Naira |
| GHS | Ghanaian Cedi |
| KES | Kenyan Shilling |

## License

MIT

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.
