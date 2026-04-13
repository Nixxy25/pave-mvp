# Pave MVP — Next.js Build Guide

## Project Overview

**Pave** is a global payment infrastructure platform built on the Stellar blockchain. It enables merchants to accept payments in 40+ local currencies (GHS, NGN, KES, XOF, etc.) and receive instant settlement in USDC via atomic path payments on Stellar. The platform includes:

- **Customer-facing checkout** — Hosted payment pages with real-time currency conversion
- **Merchant dashboard** — Payment tracking, analytics, and withdrawal management
- **Developer tools** — REST API, webhooks, and request logs
- **Stellar integration** — On-chain settlement verification, path payment visualization, and ledger tracking

The application has 14 distinct screens covering authentication, payments, settlement, withdrawals, API documentation, and account management.

---

## Recommended Folder Structure

```
pave-mvp/
├── app/
│   ├── (auth)/
│   │   └── login/                 # Authentication pages (S1)
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Dashboard layout with sidebar + topbar
│   │   ├── page.tsx               # Dashboard home (S2)
│   │   ├── payments/              # Payment list and detail views (S3)
│   │   ├── checkout-links/        # Create and manage checkout links (S4, S5)
│   │   ├── settlement/            # Stellar settlement visualization (S8)
│   │   ├── withdrawals/           # Withdrawal form and history (S10)
│   │   ├── api-webhooks/          # API documentation (S11)
│   │   ├── logs/                  # API request logs (S12)
│   │   ├── account/               # User profile (S13)
│   │   └── settings/              # Account settings (S14)
│   ├── checkout/
│   │   └── [paymentId]/           # Public checkout page (S6)
│   ├── processing/
│   │   └── [paymentId]/           # Payment processing animation (S7)
│   ├── confirmed/
│   │   └── [paymentId]/           # Payment confirmation (S9)
│   └── api/                       # Next.js API routes (if needed for server actions)
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── layout/                    # Topbar, Sidebar, Footer
│   ├── dashboard/                 # StatCard, PaymentTable, Sparkline
│   ├── checkout/                  # CheckoutCard, PaymentMethodSelector, CurrencySelector
│   ├── settlement/                # PathVisualization, ProgressList, StellarDetails
│   └── common/                    # Reusable components (Avatar, Badge, NotificationPanel)
├── lib/
│   ├── api.ts                     # ALL API calls — payments, withdrawals, webhooks, etc.
│   ├── utils.ts                   # Utility functions (formatCurrency, formatDate, etc.)
│   └── stellar.ts                 # Stellar-specific utilities (TX validation, explorer links)
├── types/
│   ├── index.ts                   # Export all types
│   ├── payment.ts                 # Payment, PaymentStatus, PaymentMethod
│   ├── user.ts                    # User, Merchant, Account
│   ├── withdrawal.ts              # Withdrawal, BankAccount
│   ├── api.ts                     # APILog, WebhookEvent
│   └── stellar.ts                 # StellarTransaction, PathPayment
├── data/
│   ├── payments.json              # Mock payment data
│   ├── users.json                 # Mock user/payer data
│   ├── withdrawals.json           # Mock withdrawal history
│   ├── api-logs.json              # Mock API request logs
│   └── notifications.json         # Mock notification data
├── hooks/
│   ├── use-payments.ts            # Payment data fetching and mutations
│   ├── use-balance.ts             # Balance and stats
│   └── use-notifications.ts       # Notification state management
└── styles/
    └── globals.css                # Global styles, CSS variables
```

### Folder Explanations

- **`app/(auth)/`** — Authentication pages using Next.js route groups for layout separation
- **`app/(dashboard)/`** — Protected merchant dashboard with shared layout (sidebar + topbar)
- **`app/checkout/[paymentId]/`** — Public-facing checkout pages (no auth required)
- **`components/ui/`** — All shadcn/ui primitives (button, input, table, etc.)
- **`components/layout/`** — Topbar, Sidebar, and other layout components
- **`components/dashboard/`** — Dashboard-specific components (stat cards, charts, tables)
- **`lib/api.ts`** — Central API layer — ALL backend calls live here
- **`types/`** — TypeScript interfaces for every data shape
- **`data/`** — Mock JSON files for development (no inline mock data in components)
- **`hooks/`** — Custom React hooks for data fetching and state management

---

## Component Breakdown

### Authentication (S1 — Sign In)

**Components to create:**
- `LoginForm` — Maps to the sign-in form with email/password inputs
- Uses `Input`, `Button`, `Checkbox` from shadcn/ui

**What it does:** 
- Handles user authentication
- Validates email/password
- Redirects to dashboard on success

---

### Dashboard Layout (Shared across S2–S14)

**Components to create:**
- `DashboardLayout` — Wrapper with `Topbar` + `Sidebar` + main content area
- `Topbar` — Logo, network pill, notification button, avatar dropdown
- `Sidebar` — Navigation menu with sections and active state
- `NotificationPanel` — Slide-out drawer showing recent notifications

**Uses shadcn/ui:**
- `Avatar`, `Badge`, `Button`, `DropdownMenu`, `Sheet` (for notification panel)

**What it does:**
- Provides consistent navigation across all dashboard pages
- Shows merchant info (name, avatar, wallet balance)
- Displays real-time notifications

---

### Dashboard Home (S2)

**Components to create:**
- `StatCard` — Card showing metric (balance, payments, avg settle time) with sparkline
- `Sparkline` — Mini bar chart visualization
- `RecentPaymentsTable` — Table of latest payments with status badges
- `StatusBanner` — Alert/banner showing system status

**Uses shadcn/ui:**
- `Card`, `Table`, `Badge`, `Input` (search), `Button`

**What it does:**
- Shows key metrics (balance, payment count, conversion rate)
- Displays recent payment activity
- Provides quick actions (create payment, filter, search)

---

### Payments List (S3)

**Components to create:**
- `PaymentListTable` — Full payment history with filters
- `PaymentRow` — Individual row with payer info, amount, status, Stellar TX
- `FilterBar` — Search input + status dropdown filter

**Uses shadcn/ui:**
- `Table`, `Select`, `Input`, `Badge`, `Avatar`

**What it does:**
- Lists all payments with pagination
- Filters by status (settled, routing, failed)
- Shows Stellar transaction hashes
- Clicking a row navigates to payment detail

---

### Create Checkout Link (S4)

**Components to create:**
- `CreateCheckoutForm` — Multi-step form for generating payment links
- `StepIndicator` — Progress bar showing current step (1. Details → 2. Currencies → 3. Generate)
- `CurrencyChipSelector` — Multi-select chips for accepted currencies
- `AmountInput` — Specialized input with currency prefix

**Uses shadcn/ui:**
- `Input`, `Select`, `Button`, `Card`, `Badge`

**What it does:**
- Collects payment details (amount, description, settlement asset)
- Allows merchant to select accepted currencies (GHS, USD, KES, etc.)
- Generates a hosted checkout URL

---

### Link Generated (S5)

**Components to create:**
- `CheckoutLinkSuccess` — Success state showing generated URL
- `QRCodeDisplay` — QR code for mobile payment
- `LinkDetailsGrid` — Grid showing amount, expiry, accepted currencies

**Uses shadcn/ui:**
- `Card`, `Button`, `Badge`

**What it does:**
- Displays the generated checkout URL
- Provides "Copy Link" button
- Shows QR code for easy mobile access
- Links to preview checkout page

---

### Customer Checkout (S6)

**Components to create:**
- `CheckoutCard` — Public-facing payment card with merchant branding
- `PaymentMethodSelector` — Radio group for payment methods (Mobile Money, Card, Stellar)
- `CurrencySelector` — Dropdown to choose payment currency
- `LiveRateIndicator` — Badge showing live conversion rate

**Uses shadcn/ui:**
- `Card`, `Select`, `RadioGroup`, `Button`, `Badge`

**What it does:**
- Shows merchant details and payment amount
- Allows customer to select payment method
- Converts to customer's local currency in real-time
- Initiates payment flow

---

### Payment Processing (S7)

**Components to create:**
- `ProcessingAnimation` — Loading spinner with Stellar routing info
- `RoutingPathDisplay` — Shows GHS → XLM → USDC conversion path
- `ProgressBar` — Animated progress indicator

**Uses shadcn/ui:**
- `Card`, `Progress`, `Badge`

**What it does:**
- Shows processing animation while payment routes through Stellar
- Displays network fees and conversion details
- Auto-advances to settlement screen when complete

---

### Stellar Settlement (S8)

**Components to create:**
- `PathPaymentVisualization` — Animated flow showing GHS → XLM → USDC path
- `SettlementProgressList` — Step-by-step progress tracker
- `StellarMetadata` — Shows ledger number, network fees, operation type

**Uses shadcn/ui:**
- `Card`, `Badge`

**What it does:**
- Visualizes atomic path payment on Stellar network
- Shows each hop in the conversion chain
- Displays Stellar transaction metadata
- Real-time updates as ledger confirms

---

### Payment Confirmed (S9)

**Components to create:**
- `ConfirmationPanel` — Success state with checkmark icon
- `PaymentDetailsCard` — Table showing payer, amount, settlement path, TX hash
- `BalanceUpdateMiniCards` — Shows new balance and settle time

**Uses shadcn/ui:**
- `Card`, `Badge`, `Button`

**What it does:**
- Confirms successful payment
- Shows final settlement details
- Links to Stellar Explorer for on-chain verification
- Provides navigation to withdrawals

---

### Withdrawals (S10)

**Components to create:**
- `WithdrawalForm` — Form to withdraw USDC to bank account
- `WithdrawalHistoryTable` — Past withdrawal transactions
- `BalanceCards` — Shows available, pending, and withdrawn amounts

**Uses shadcn/ui:**
- `Input`, `Select`, `Button`, `Card`, `Table`, `Badge`

**What it does:**
- Creates withdrawal requests (USDC → bank via Stellar anchor)
- Shows available balance
- Displays withdrawal history with status

---

### API & Webhooks (S11)

**Components to create:**
- `APIDocsSidebar` — Left navigation for API endpoints
- `APIEndpointPanel` — Code examples with request/response
- `CodeBlock` — Syntax-highlighted code display
- `CopyButton` — Copies code to clipboard

**Uses shadcn/ui:**
- `Card`, `Button`, `Badge`, `Tabs`

**What it does:**
- Shows API documentation for payments, payouts, webhooks
- Provides code examples in JavaScript
- Displays request/response formats
- Links to external docs

---

### API Logs (S12)

**Components to create:**
- `APILogTable` — Table of all API requests and webhooks
- `MethodBadge` — Badge showing HTTP method (POST, GET, DELETE)
- `StatusBadge` — Badge showing HTTP status (200, 422, etc.)

**Uses shadcn/ui:**
- `Table`, `Input`, `Button`, `Badge`

**What it does:**
- Lists all API requests with timestamps
- Shows endpoint, method, status, duration
- Provides filtering and export functionality

---

### Account Profile (S13)

**Components to create:**
- `ProfileCard` — User info with avatar and verification status
- `PlanCard` — Current subscription plan details
- `UsageStatsCard` — Monthly volume and fee breakdown

**Uses shadcn/ui:**
- `Card`, `Avatar`, `Badge`, `Button`, `Input`

**What it does:**
- Displays merchant profile and business info
- Shows Stellar wallet address
- Displays current plan and features
- Shows monthly usage stats

---

### Settings (S14)

**Components to create:**
- `APIKeyManager` — Display and manage API keys
- `WebhookSettings` — Configure webhook endpoint
- `PreferencesToggleList` — List of toggle switches for preferences

**Uses shadcn/ui:**
- `Card`, `Input`, `Button`, `Switch`, `Badge`

**What it does:**
- Manages API keys (live/test)
- Configures webhook endpoints
- Sets user preferences (notifications, auto-withdrawal, 2FA)

---

## shadcn/ui Components Required

Install these shadcn/ui components in order:

```bash
# Core UI primitives
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add avatar

# Form components
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch

# Data display
npx shadcn@latest add table
npx shadcn@latest add separator

# Overlays and feedback
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add toast
npx shadcn@latest add progress

# Navigation
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
```

### Additional Libraries Required

**For UI elements not covered by shadcn/ui:**

1. **Sparkline charts** — Use `recharts` or build custom SVG component
   ```bash
   npm install recharts
   ```

2. **QR Code generation** — Use `qrcode.react`
   ```bash
   npm install qrcode.react
   ```

3. **Code syntax highlighting** — Use `react-syntax-highlighter`
   ```bash
   npm install react-syntax-highlighter @types/react-syntax-highlighter
   ```

4. **Date formatting** — Use `date-fns`
   ```bash
   npm install date-fns
   ```

5. **Currency formatting** — Use built-in `Intl.NumberFormat` (no library needed)

---

## Setup Instructions

### 1. Install Dependencies

```bash
# Core dependencies (already done if Next.js project exists)
npm install

# Install shadcn/ui (if not already set up)
npx shadcn@latest init

# Install additional libraries
npm install recharts qrcode.react react-syntax-highlighter date-fns
npm install -D @types/react-syntax-highlighter
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Stellar Configuration (optional for live network)
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_EXPLORER_URL=https://stellar.expert/explorer/testnet

# Authentication (if using NextAuth or similar)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Optional: Rate limiting, analytics, etc.
NEXT_PUBLIC_APP_ENV=development
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## Mock Data Layer

### How It Works

All mock data lives in `.json` files inside the `/data` folder. The `/lib/api.ts` file contains functions that currently read from these JSON files. Each function has the **exact same signature** as the real API function will have.

### Mock Data Files

**`/data/payments.json`**
```json
[
  {
    "id": "pay_9xKm3TqNvZ",
    "status": "settled",
    "payer": {
      "name": "Ama Owusu",
      "location": "Accra, Ghana",
      "avatar": "AO"
    },
    "amount": 192.40,
    "currency": "GHS",
    "settledAmount": 28.00,
    "settledCurrency": "USDC",
    "method": "Mobile Money",
    "stellarTxHash": "a3f9e2b4c81d7f3e9b2a...c7d1",
    "ledgerSequence": 49871234,
    "settlementPath": ["GHS", "XLM", "USDC"],
    "settleTime": 4.2,
    "createdAt": "2025-03-15T14:22:58Z",
    "settledAt": "2025-03-15T14:23:07Z"
  }
]
```

**`/data/users.json`**
```json
{
  "id": "user_1",
  "name": "Chukwuemeka Obi",
  "email": "chukwuemeka@saasco.ng",
  "businessName": "Chukwuemeka's SaaS Co.",
  "country": "Nigeria",
  "stellarWallet": "GBXYZ...PAR7",
  "kycStatus": "verified",
  "plan": "growth",
  "avatar": "CE"
}
```

**`/data/withdrawals.json`**
**`/data/api-logs.json`**
**`/data/notifications.json`**
— Similar structure following the data shapes in the HTML

### Example API Function

**`/lib/api.ts`**

```typescript
// TODO: Replace mock data with real API call when backend is ready
export async function getPayments(filters?: PaymentFilters): Promise<Payment[]> {
  // Mock implementation
  const mockData = await import('@/data/payments.json');
  return mockData.default;
  
  // Real implementation (commented out for now):
  // const params = new URLSearchParams(filters);
  // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments?${params}`);
  // return response.json();
}

// TODO: Replace mock data with real API call when backend is ready
export async function createPayment(data: CreatePaymentData): Promise<Payment> {
  // Mock implementation
  const newPayment = {
    id: `pay_${Math.random().toString(36).substring(7)}`,
    status: 'pending',
    ...data,
    createdAt: new Date().toISOString()
  };
  return newPayment;
  
  // Real implementation:
  // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data)
  // });
  // return response.json();
}

// TODO: Replace mock data with real API call when backend is ready
export async function getBalance(): Promise<BalanceData> {
  // Mock implementation
  return {
    available: 2840,
    currency: 'USDC',
    pending: 200
  };
  
  // Real implementation:
  // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/balance`);
  // return response.json();
}
```

### Data Location

- **Mock data:** `/data/*.json` files
- **API functions:** `/lib/api.ts` (all functions)
- **Types:** `/types/*.ts` (all interfaces)
- **Component usage:** Components import from `/lib/api.ts`, never directly from `/data`

**Example component usage:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getPayments } from '@/lib/api';
import { Payment } from '@/types/payment';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    getPayments().then(setPayments);
  }, []);

  return (
    // Render payments table
  );
}
```

---

## Backend Integration Checklist

When the real backend is ready, update **only** these files. No component code should need to change.

### Files to Update

1. **`.env.local`**
   - Update `NEXT_PUBLIC_API_URL` to point to production backend
   - Example: `NEXT_PUBLIC_API_URL=https://api.pave.finance`

2. **`/lib/api.ts`** — Update every function body:
   
   **Function: `getPayments()`**
   - Replace mock JSON import with real fetch call
   - Add authentication headers
   - Handle errors and loading states
   
   **Function: `getPaymentById(id: string)`**
   - Replace mock lookup with API call
   - Return real payment data
   
   **Function: `createPayment(data: CreatePaymentData)`**
   - Replace mock object creation with POST request
   - Return actual backend response
   
   **Function: `createWithdrawal(data: WithdrawalData)`**
   - Replace mock with POST to `/v1/payouts`
   
   **Function: `getWithdrawals()`**
   - Replace mock with GET from `/v1/payouts`
   
   **Function: `getAPILogs()`**
   - Replace mock with GET from `/v1/logs`
   
   **Function: `updateSettings(data: SettingsData)`**
   - Replace mock with PUT/PATCH to `/v1/settings`
   
   **Function: `getBalance()`**
   - Replace mock with GET from `/v1/balance`
   
   **Function: `getNotifications()`**
   - Replace mock with GET from `/v1/notifications`

3. **Add Authentication Headers** in `/lib/api.ts`:
   ```typescript
   const headers = {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${getApiKey()}` // from session/cookie
   };
   ```

4. **Error Handling** — Add to all API functions:
   ```typescript
   if (!response.ok) {
     throw new Error(`API error: ${response.statusText}`);
   }
   ```

5. **Loading States** — Ensure all components handle:
   - Loading (show skeleton/spinner)
   - Error (show error message)
   - Empty state (no data)

### Testing Backend Integration

1. Update `NEXT_PUBLIC_API_URL` in `.env.local`
2. Replace one function in `/lib/api.ts` at a time
3. Test the corresponding page in the UI
4. Verify data loads correctly
5. Check error handling works
6. Move to next function

### No Changes Required In:

- ✅ Components (they already use `/lib/api.ts`)
- ✅ Types (interfaces remain the same)
- ✅ UI components (shadcn/ui)
- ✅ Layouts
- ✅ Routing

---

## CSS Variables and Theming

The HTML uses CSS custom properties. Convert to Tailwind in `globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 98%;
    --foreground: 24 10% 10%;
    --card: 0 0% 100%;
    --card-foreground: 24 10% 10%;
    --primary: 17 100% 47%; /* Orange #f25c00 */
    --primary-foreground: 0 0% 100%;
    --secondary: 220 60% 50%; /* Blue for badges */
    --muted: 36 6% 90%;
    --muted-foreground: 36 6% 50%;
    --accent: 17 100% 47%;
    --destructive: 0 84% 60%;
    --border: 32 8% 90%;
    --input: 32 8% 90%;
    --ring: 17 100% 47%;
    --radius: 0.625rem; /* 10px */
    
    /* Custom colors for Stellar/crypto themes */
    --stellar: 220 60% 55%;
    --success: 160 84% 39%;
    --warning: 30 96% 47%;
  }
}
```

Use Tailwind classes throughout components, referencing these variables.

---

## Key Implementation Notes

### 1. All API Calls in `/lib/api.ts`

**Never call APIs directly from components.** Always use the centralized functions:

```typescript
// ❌ Bad — Don't do this
const response = await fetch('/api/payments');

// ✅ Good — Always do this
const payments = await getPayments();
```

### 2. No Hardcoded URLs

**All URLs must come from environment variables:**

```typescript
// ❌ Bad
const response = await fetch('https://api.pave.finance/payments');

// ✅ Good
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments`);
```

### 3. Mock Data Comment Convention

**Every function using mock data must have this exact comment:**

```typescript
// TODO: Replace mock data with real API call when backend is ready
export async function getPayments() {
  // ... mock implementation
}
```

### 4. TypeScript Interfaces

**Every data shape must have a TypeScript interface in `/types`:**

```typescript
// /types/payment.ts
export interface Payment {
  id: string;
  status: 'pending' | 'settled' | 'failed' | 'routing';
  payer: Payer;
  amount: number;
  currency: string;
  settledAmount: number;
  settledCurrency: string;
  stellarTxHash?: string;
  // ... all other fields
}

export interface Payer {
  name: string;
  location: string;
  avatar: string;
}
```

### 5. Consistent Function Signatures

**Mock and real functions must have identical signatures:**

```typescript
// Mock version
// TODO: Replace mock data with real API call when backend is ready
export async function getPayments(filters?: PaymentFilters): Promise<Payment[]> {
  const data = await import('@/data/payments.json');
  return data.default;
}

// Real version (same signature)
export async function getPayments(filters?: PaymentFilters): Promise<Payment[]> {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments?${params}`);
  return response.json();
}
```

This ensures **zero component changes** are needed when switching from mock to real backend.

---

## Development Workflow

1. **Start with mock data** — Build all UI components using JSON files
2. **Test all screens** — Ensure navigation and state transitions work
3. **Validate types** — Ensure all data matches TypeScript interfaces
4. **Test error states** — Add loading/error/empty states to all components
5. **Backend ready?** — Update `.env.local` and `/lib/api.ts` functions one at a time
6. **Deploy** — Ship to production

---

## Font Configuration

The HTML uses custom fonts. Add to `/app/layout.tsx`:

```typescript
import { Fraunces, GeistSans, GeistMono } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['300', '400', '500'],
  style: ['normal', 'italic']
});

const geistSans = GeistSans({
  subsets: ['latin'],
  variable: '--font-sans'
});

const geistMono = GeistMono({
  subsets: ['latin'],
  variable: '--font-mono'
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Summary

This guide provides everything needed to convert the Pave HTML into a production-ready Next.js application:

- ✅ Complete component breakdown for all 14 screens
- ✅ shadcn/ui component mapping for every UI element
- ✅ Centralized API layer in `/lib/api.ts`
- ✅ Mock data structure in `/data` folder
- ✅ TypeScript interfaces in `/types`
- ✅ Clear backend integration checklist
- ✅ Environment variable configuration
- ✅ No hardcoded URLs anywhere
- ✅ Consistent function signatures for seamless backend swap

**When the backend is ready:** Update `.env.local` and replace function bodies in `/lib/api.ts`. Nothing else changes.
