# Pave — Payment Infrastructure for Africa

Pave is a **payment infrastructure platform** (like Stripe Checkout) that enables platforms and merchants to accept payments across Africa with instant USDC settlement on the Stellar blockchain.

## What is Pave?

- **For Platforms/Apps**: Integrate Pave's API → get a hosted checkout page for African payments
- **For Customers**: Pay using mobile money or cards via Pave's checkout UI
- **For Merchants**: Receive settlements in USDC (via Stellar blockchain)

## Features

- **Multiple Payment Methods**: Mobile Money (MTN, Airtel, Vodafone) + Cards (Visa, Mastercard)
- **Multi-Currency Support**: GHS, USD, KES, XOF, NGN
- **Instant Settlement**: ~5 second finality on Stellar blockchain
- **Dark Mode**: Full dark mode support across all pages
- **Merchant Dashboard**: Track payments, withdrawals, and analytics
- **Checkout Links**: Generate shareable payment links
- **Webhooks**: Real-time payment notifications
- **Mobile Friendly**: Responsive design for all devices

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/pave-mvp.git
cd pave-mvp

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
pave-mvp/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication (login, signup)
│   ├── dashboard/         # Merchant dashboard
│   ├── payments/          # Payment management
│   ├── checkout-links/    # Checkout link generation
│   ├── checkout/[id]/     # Customer checkout page
│   ├── withdrawals/       # Withdrawal management
│   └── settings/          # Account settings
├── components/
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components (sidebar, topbar)
├── lib/
│   ├── api.ts            # API/data layer
│   └── constants.ts      # Shared constants
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Blockchain**: Stellar (for USDC settlement)
- **State**: React hooks + localStorage (MVP)

## Supported Currencies

| Currency | Name | Country |
|----------|------|---------|
| GHS | Ghanaian Cedi | Ghana |
| USD | US Dollar | USA |
| KES | Kenyan Shilling | Kenya |
| XOF | CFA Franc | West Africa |
| NGN | Nigerian Naira | Nigeria |

## Dark Mode

Full dark mode support using CSS custom properties and Tailwind's `dark:` variants. Theme persists across sessions.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

Built for African payments
