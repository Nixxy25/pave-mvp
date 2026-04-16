# Pave MVP — Complete Project Documentation

## 🎯 Project Overview

**Pave** is a **payment infrastructure/API platform** (like Stripe Checkout) that other platforms and merchants integrate into their websites/apps. When their customers want to pay, they're redirected to Pave's hosted checkout page.

### Core Value Proposition (Infrastructure)
- **For Platforms/Apps**: Integrate Pave's API → get a hosted checkout page for African payments
- **For End Customers**: Pay using mobile money, cards (via Pave's checkout UI)
- **For Merchants**: Receive settlements in USDC (via Stellar blockchain infrastructure)

### How It Works
```
E-commerce website → User clicks "Pay with Pave" → 
Redirects to Pave hosted checkout → Customer pays → 
Redirects back to merchant site → Merchant receives USDC
```

**Think of it as**: Stripe Checkout for African payments + Stellar settlement infrastructure

---

## 🏗️ Current Project Structure

### Folder Organization (Latest)

```
pave-mvp/
├── app/
│   ├── (auth)/                    # Authentication routes
│   │   ├── login/                 # Login page
│   │   └── signup/                # Signup page
│   ├── dashboard/                 # Main merchant dashboard
│   │   ├── layout.tsx            # Dashboard wrapper with sidebar/topbar
│   │   └── page.tsx              # Dashboard home - stats & overview
│   ├── payments/                  # Payment management
│   ├── checkout-links/            # Create & manage checkout links
│   ├── settlement/                # Stellar settlement visualization
│   ├── withdrawals/               # Withdraw USDC to bank account
│   ├── api-webhooks/              # API documentation
│   ├── logs/                      # API request logs
│   ├── account/                   # User profile (CONSOLIDATED)
│   ├── settings/                  # Account settings
│   ├── checkout/
│   │   └── [id]/                  # Public customer checkout page
│   ├── processing/                # Payment processing animation
│   ├── confirmed/                 # Payment success page
│   ├── layout.tsx                 # Root layout with fonts, theme provider
│   ├── page.tsx                   # Landing page
│   └── globals.css                # Global styles + dark mode variables
├── components/
│   ├── ui/                        # shadcn/ui primitives + custom components
│   │   ├── data-table.tsx        # 🆕 Reusable table components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ... (14 more UI components)
│   ├── layout/
│   │   ├── dashboard-layout.tsx  # Dashboard wrapper
│   │   ├── sidebar.tsx           # Navigation sidebar
│   │   ├── topbar.tsx            # Top navigation bar
│   │   └── notification-panel.tsx # Notification drawer
│   ├── theme-provider.tsx        # Dark mode context
│   └── theme-toggle.tsx          # Dark/light mode switcher
├── lib/
│   ├── api.ts                     # ALL API/localStorage logic
│   ├── constants.ts               # 🆕 SUPPORTED_CURRENCIES + helpers
│   ├── utils.ts                   # Utility functions (cn, formatting)
│   └── stellar.ts                 # Stellar-specific utilities
├── types/
│   ├── index.ts                   # Exports all types
│   ├── payment.ts                 # Payment types
│   ├── user.ts                    # User/Merchant types
│   ├── withdrawal.ts              # Withdrawal types
│   ├── api.ts                     # API/Log types
│   └── stellar.ts                 # Stellar transaction types
├── hooks/                         # Custom React hooks
│   ├── useBalance.ts
│   ├── usePayments.ts
│   ├── useWithdrawals.ts
│   └── useCheckoutLinks.ts
└── public/                        # Static assets

```

---

## 🎨 Code Quality & DRY Principles (Latest Refactor)

### ✨ New Reusable Components

#### 1. **Data Table Components** (`components/ui/data-table.tsx`)

We've eliminated repetitive table code across the entire codebase with reusable components:

```typescript
// Define columns once
const PAYMENT_COLUMNS: TableColumn[] = [
  { key: 'id', label: 'Payment ID' },
  { key: 'payer', label: 'Payer' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status', align: 'right' },
];

// Use in any table
<DataTableHeader columns={PAYMENT_COLUMNS} />
<DataTableLoading colSpan={8} message="Loading..." />
<DataTableEmpty colSpan={8} message="No data yet" />
```

**Components Available:**
- `DataTableHeader` - Consistent header styling with mapping
- `DataTableCell` - Standard cell with alignment options
- `DataTableRow` - Row with hover states
- `DataTableEmpty` - Empty state messages
- `DataTableLoading` - Loading state messages
- `DataTable` - Complete table wrapper

**Files Refactored:**
- ✅ `app/dashboard/page.tsx` - Activity table
- ✅ `app/payments/page.tsx` - Payments table
- ✅ `app/withdrawals/page.tsx` - Withdrawals table
- ✅ `app/logs/page.tsx` - API logs table
- ✅ `app/checkout-links/page.tsx` - Checkout links table

**Impact:** Eliminated ~200 lines of repetitive `<th>` declarations across 5 files.

---

### 2. **Currency Constants** (`lib/constants.ts`)

Created a single source of truth for supported currencies:

```typescript
// ✅ NEW: Single source of truth
export const SUPPORTED_CURRENCIES = ['GHS', 'USD', 'KES', 'XOF', 'NGN'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// Helper functions
export function isSupportedCurrency(code: string): code is SupportedCurrency;
export function getCurrencyName(code: string): string;
export function getCurrencySymbol(code: string): string;
export function getCountryFromCurrency(currency: string): string;
```

**Before:** Hardcoded arrays scattered across files:
```typescript
// ❌ OLD: Hardcoded everywhere
['GHS', 'USD', 'KES', 'XOF', 'NGN'].includes(curr)
['GHS', 'USD', 'KES', 'XOF', 'EUR', 'GBP'].map(...)
```

**After:** Import from constants:
```typescript
// ✅ NEW: Import once, use everywhere
import { SUPPORTED_CURRENCIES, isSupportedCurrency } from '@/lib/constants';

acceptedCurrencies.filter(isSupportedCurrency)
SUPPORTED_CURRENCIES.map((curr) => ...)
```

**Files Updated:**
- ✅ `lib/constants.ts` - Added SUPPORTED_CURRENCIES constant
- ✅ `app/checkout/[id]/page.tsx` - Uses isSupportedCurrency()
- ✅ `app/checkout-links/page.tsx` - Uses SUPPORTED_CURRENCIES

---

### 3. **Consolidated Account Page**

**Removed:** Duplicate `/app/dashboard/account/page.tsx`  
**Kept:** `/app/account/page.tsx` (single account page)

Both pages had identical UI but different data fetching. Now there's one source of truth:
- Displays user profile information
- Shows API keys
- Account statistics
- Uses proper semantic tokens for dark mode

---

## 🌙 Complete Dark Mode Implementation

### Dark Mode Architecture

**Theme System:**
```css
/* globals.css */
.dark {
  --background: oklch(0.12 0 0);        /* Dark background */
  --foreground: oklch(0.98 0 0);        /* White text */
  --card: oklch(0.17 0 0);              /* Card backgrounds */
  --muted: oklch(0.25 0 0);             /* Muted backgrounds */
  --muted-foreground: oklch(0.75 0 0);  /* Secondary text */
  --border: oklch(0.35 0 0);            /* Visible borders */
}
```

**Semantic Tokens (Use Everywhere):**
- `text-foreground` - Primary text (white in dark, black in light)
- `text-muted-foreground` - Secondary text (gray that adapts)
- `bg-card` - Card backgrounds
- `bg-muted` - Muted/subtle backgrounds
- `border` - Border colors

**Dark Mode Variants:**
```tsx
// Status badges with dark mode
className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"

// Danger sections
className="border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20"
```

### Files With Complete Dark Mode Support

**✅ All Pages:**
- Dashboard, Payments, Withdrawals, Checkout Links, Logs
- Settings, Account, API & Webhooks, Settlement
- Login, Signup, Checkout, Processing, Confirmed

**✅ All Components:**
- Sidebar, Topbar, Notification Panel
- All UI components (Button, Input, Badge, etc.)
- Data tables with hover states

**Key Changes:**
1. **Replaced all `text-gray-{400|500|600|700|900}`** → semantic tokens
2. **Added `dark:` variants** to status badges, alerts, special sections
3. **Table headers use `bg-muted/50`** with `text-muted-foreground`
4. **Input component has `text-foreground`** for proper text visibility
5. **Sign Out section is now neutral** (no red danger zone styling)

---

## 💾 Data Storage: localStorage (MVP)

### Current Implementation

All data stored in browser's `localStorage` with per-user namespacing:

```javascript
// Global storage
pave_users                     // Array of all users
pave_current_user              // Currently logged-in user ID

// Per-user storage
pave_payments_{userId}         // User's payments
pave_withdrawals_{userId}      // User's withdrawals
pave_checkout_links_{userId}   // User's checkout links
pave_balance_{userId}          // User's balance
pave_api_logs_{userId}         // User's API logs
pave_notifications_{userId}    // User's notifications
```

### Why localStorage?
- ✅ No backend needed for MVP
- ✅ Fast development iteration
- ✅ Zero infrastructure costs
- ❌ Not production-ready
- ❌ Data lost on browser clear
- ❌ No cross-device sync

### Migration Path

**All data operations go through `lib/api.ts`**. To migrate to a real backend:

1. Keep the same function signatures in `lib/api.ts`
2. Replace localStorage calls with API fetch calls
3. Components don't need to change - they just call `getPayments()`

```typescript
// Current (localStorage)
export async function getPayments(): Promise<Payment[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  return response.json();
}
```

---

## 🔄 Complete Payment Flow

### Step 1: Merchant Creates Checkout Link
**Where**: `/checkout-links`  
**Action**: Merchant creates a payment link

```typescript
createCheckoutLink({
  amount: 45000,
  currency: 'NGN',
  description: 'PRO PLAN — NOVEMBER',
  acceptedCurrencies: ['GHS', 'USD', 'KES', 'XOF', 'NGN']
})
```

Pave generates URL: `http://localhost:3001/checkout/pay_abc123`

### Step 2: Customer Visits Checkout
**Route**: `/checkout/[id]`  
**What customer sees**:
- Merchant business info
- Payment amount with live exchange rate
- Payment methods (mobile money, card)
- Currency selector (using SUPPORTED_CURRENCIES)

### Step 3: Payment Processing
**MVP**: Simulated 2-second delay → instant completion  
**Production**: Flutterwave/Paystack → Stellar settlement

### Step 4: Payment Success
**Route**: `/confirmed/[id]`  
Receipt with payment details and Stellar transaction hash

### Step 5: Merchant Dashboard
**Route**: `/payments`  
Merchant sees payment in their dashboard, balance updated

---

## 🌟 Stellar Blockchain Integration

### What is Stellar?
Fast (5s finality), cheap ($0.00001/tx) blockchain for payments.

### Key Concepts

**Path Payments:**
```
Customer NGN → Stellar DEX → XLM → USDC → Merchant
```

**Atomic Transactions:** Either entire payment succeeds or gets rolled back (no partial failures)

**Settlement:** Merchants receive USDC (stablecoin), avoiding currency volatility

**Transparency:** Every transaction visible on [Stellar Expert](https://stellar.expert/explorer/testnet)

---

## 🔐 Authentication System

### Current Flow (localStorage)
5. Initialize empty arrays for payments, withdrawals, etc.
6. Set `pave_current_user` = user.id
7. Redirect to `/dashboard`

### Login (`/login`)
1. User enters email + password
2. Fetch `pave_users` array from localStorage
3. Find matching user:
   ```typescript
   const user = users.find(u => 
     u.email === email && u.password === password
   );
   ```
4. If found: set `pave_current_user`, redirect to `/dashboard`
5. If not: show error "Invalid email or password"

### Logout
```typescript
localStorage.removeItem('pave_current_user');
router.push('/login');
```

---

## 🎨 UI Components & Styling

### Theme System
- **Light mode** (default): White background, gray text
- **Dark mode**: Dark gray background, light text
- **Theme provider**: `/components/theme-provider.tsx`
- **Theme toggle**: Sun/Moon icon in topbar
- **Persistence**: Saves preference in `localStorage: 'pave-theme'`

### Color Palette
```css
--pave-orange: #f25c00        /* Primary brand color */
--stellar: #3b5bdb            /* Stellar blue */
--success: #059669            /* Green for completed */
--warning: #d97706            /* Orange for pending */
--error: #dc2626              /* Red for failed */
```

### shadcn/ui Components Used (16 total)
- `button`, `input`, `card`, `table`
- `dialog`, `sheet`, `badge`, `select`
- `checkbox`, `radio-group`, `switch`, `progress`
- `dropdown-menu`, `tabs`, `separator`, `label`

### Fonts
- **Serif (Headings)**: Fraunces - Elegant, italic, lightweight
- **Sans (Body)**: Geist - Clean, modern
- **Mono (Code)**: Geist Mono - For IDs, TX hashes, API keys

---

## 📡 Future: Migrating from localStorage to Real Backend

When ready to go production, you'll replace `lib/api.ts` with real API calls. Here's the plan:

### Option 1: AWS Backend (Recommended for Scale)

**Architecture**:
```
Next.js Frontend (Vercel)
        ↓
API Gateway + Lambda (AWS)
        ↓
DynamoDB (AWS)  +  Cognito (Auth)
        ↓
Stellar Network (Blockchain)
```

**Cost**: $0-10/month for first 1000 users

**Changes needed** (ONLY in `lib/api.ts`):
```typescript
// Before (localStorage)
export async function getPayments() {
  return getUserData('payments', []);
}

// After (AWS API)
export async function getPayments() {
  const response = await fetch('https://api.pave.com/payments', {
    headers: {
      'Authorization': `Bearer ${getCognitoToken()}`
    }
  });
  return response.json();
}
```

### Option 2: Supabase (Easiest Migration)

**What is Supabase**: PostgreSQL database + Auth + Realtime subscriptions + REST API (all auto-generated)

**Cost**: FREE up to 500MB database + 50,000 monthly active users

**Changes needed**:
1. Install Supabase: `npm install @supabase/supabase-js`
2. Create Supabase project → get URL + API key
3. Update `lib/api.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.NEXT_PUBLIC_SUPABASE_KEY
   )
   
   export async function getPayments() {
     const { data } = await supabase
       .from('payments')
       .select('*')
       .eq('merchant_id', getCurrentUserId());
     return data;
   }
   ```

**That's it!** All your React components stay the same.

---

## 🚀 Quick Start Guide

### Run the Development Server
```bash
npm run dev
# Opens at http://localhost:3001
```

### Create a Test Account
1. Go to http://localhost:3001/signup
2. Fill in:
   - Name: Tella Oyinkansola
   - Email: tella@test.com
   - Password: password123
   - Business: Tella's Shop
3. Click "Create Account"
4. You'll be redirected to `/dashboard`

### Test Payment Flow
1. Go to `/checkout-links`
2. Click "+ New Checkout Link"
3. Fill in: Amount 45000, Currency NGN, Description "Test Payment"
4. Click "Create Link"
5. Copy the checkout URL (looks like: `/checkout/pay_...`)
6. Open URL in new tab (simulating customer)
7. Select payment method & currency
8. Click "Pay" → watch processing animation
9. View payment in `/payments` table
10. Check Stellar TX hash (links to blockchain explorer)

### View User Profile
1. Click avatar in topbar/sidebar
2. See your initials (TO for Tella Oyinkansola)
3. View Stellar wallet address, API keys, plan

### Toggle Dark Mode
1. Click sun/moon icon in topbar
2. Preference saves to localStorage

---

## 📝 Summary of Recent Changes

### ✅ What Was Fixed

1. **Routing Structure** 
   - Changed from `/dashboard/payments` → `/payments`
   - Changed from `/dashboard/checkout-links` → `/checkout-links`  
   - Same for settlement, withdrawals, api-webhooks, logs
   - `/account` is now root-level (not `/dashboard/account`)
   - Dashboard layout still wraps all pages

2. **Avatar Initials**
   - Removed hardcoded "CE"
   - Now dynamically shows user initials (Tella Oyinkansola → TO)
   - Updates in sidebar bottom section AND topbar
   - Loads from `getUserProfile()` in `lib/api.ts`

3. **Checkout Link URL**
   - Displays full URL: `http://localhost:3001/checkout/{id}`
   - Copy button with "✓ Copied" feedback
   - Clickable to open customer checkout page

4. **Customer Checkout Page**
   - Created `/checkout/[id]/page.tsx`
   - Beautiful UI with merchant branding and payment options
   - Shows merchant info, payment methods, currency selector
   - Live exchange rate display
   - "Pay" button navigates to processing

5. **Dark Mode**
   - Complete dark mode implementation
   - Theme toggle in topbar
   - Saves preference to localStorage
   - CSS variables update automatically

---

## 🎓 Key Concepts to Understand

### 1. **Stellar Path Payments = Magic**
Normal payment flow:
```
Customer → Bank → Currency exchange → Another bank → Merchant
(Takes days, high fees, manual reconciliation)
```

Stellar path payment:
```
Customer NGN → Stellar DEX → USDC → Merchant
(Takes 5 seconds, $0.003 fee, automatic, on-chain proof)
```

###

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
---

## 📋 Development Checklist

When working on this codebase, follow these principles:

### ✅ DRY Principles (Don't Repeat Yourself)

**Always check for existing solutions before coding:**
1. **Tables?** Use `DataTableHeader` component from `components/ui/data-table.tsx`
2. **Currencies?** Import `SUPPORTED_CURRENCIES` from `lib/constants.ts`
3. **Text colors?** Use semantic tokens (`text-foreground`, `text-muted-foreground`)
4. **Status badges?** Add `dark:` variants for dark mode

**Never hardcode:**
- ❌ Currency arrays: `['GHS', 'USD', 'KES']`
- ❌ Table headers: Repetitive `<th>` elements
- ❌ Gray colors: `text-gray-500` (use `text-muted-foreground`)
- ❌ Loading states: Custom empty/loading messages

**Always use:**
- ✅ `SUPPORTED_CURRENCIES` constant
- ✅ `DataTableHeader` with column mapping
- ✅ Semantic color tokens
- ✅ Reusable `DataTableLoading` / `DataTableEmpty` components

### 🎨 Styling Guidelines

**Dark Mode:**
```tsx
// ✅ Good: Semantic tokens
className="text-foreground bg-card border"

// ✅ Good: Dark variants
className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"

// ❌ Bad: Hardcoded gray
className="text-gray-500"
```

**Tables:**
```tsx
// ✅ Good: Reusable component
<DataTableHeader columns={COLUMNS} />

// ❌ Bad: Repetitive code
<thead>
  <tr>
    <th className="px-4 py-3 text-left...">Header 1</th>
    <th className="px-4 py-3 text-left...">Header 2</th>
  </tr>
</thead>
```

### 🔧 Code Organization

**File Structure:**
- `lib/api.ts` - All data fetching/mutation
- `lib/constants.ts` - Shared constants (currencies, etc.)
- `components/ui/` - Reusable UI primitives
- `hooks/` - Custom React hooks
- `types/` - TypeScript interfaces

**Component Pattern:**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { getData } from '@/lib/api';
import { SUPPORTED_CURRENCIES } from '@/lib/constants';
import { DataTableHeader } from '@/components/ui/data-table';

export default function MyPage() {
  // 1. State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Effects
  useEffect(() => {
    loadData();
  }, []);

  // 3. Functions
  const loadData = async () => {
    const result = await getData();
    setData(result);
    setLoading(false);
  };

  // 4. Render
  return (
    <div>
      <DataTableHeader columns={COLUMNS} />
      {/* ... */}
    </div>
  );
}
```

---

## 🚀 Next Steps

### For MVP Completion

1. **Authentication improvements**
   - Hash passwords properly (use bcrypt)
   - Add password reset flow
   - Session management with JWT

2. **Real backend integration**
   - Replace localStorage with database (PostgreSQL/Supabase)
   - Update `lib/api.ts` functions
   - Keep same function signatures

3. **Payment processor integration**
   - Integrate Flutterwave/Paystack API
   - Handle webhooks for payment confirmation
   - Process refunds and failed payments

4. **Stellar integration**
   - Build settlement service
   - Implement path payments
   - Generate Stellar wallets for new merchants
   - Monitor blockchain for confirmations

5. **Production features**
   - Rate limiting
   - Error logging (Sentry)
   - Analytics (PostHog, Mixpanel)
   - Email notifications
   - Webhook delivery system

### For Scaling

1. **Infrastructure**
   - Deploy to Vercel/AWS
   - Set up PostgreSQL database
   - Redis for caching
   - CDN for assets

2. **Monitoring**
   - Application performance monitoring
   - Error tracking
   - User analytics
   - Transaction monitoring

3. **Security**
   - API key rotation
   - Rate limiting per merchant
   - Input validation on all endpoints
   - PCI compliance for card payments

---

## 📚 Key Files Reference

### Most Important Files

| File | Purpose | When to Edit |
|------|---------|--------------|
| `lib/api.ts` | All data operations | Adding features, backend migration |
| `lib/constants.ts` | Shared constants | Adding currencies, config |
| `components/ui/data-table.tsx` | Reusable tables | Improving table UI |
| `app/globals.css` | Dark mode variables | Adjusting colors, themes |
| `types/index.ts` | TypeScript types | Adding data structures |

### Common Tasks

**Add a new currency:**
1. Update `SUPPORTED_CURRENCIES` in `lib/constants.ts`
2. Add to `CURRENCY_NAMES`, `CURRENCY_SYMBOLS`, `CURRENCY_COUNTRIES`
3. Update conversion rates in `CONVERSION_RATES`

**Add a new table:**
1. Define columns: `const COLUMNS: TableColumn[] = [...]`
2. Use `<DataTableHeader columns={COLUMNS} />`
3. Use `<DataTableLoading>` and `<DataTableEmpty>` for states

**Add dark mode to component:**
1. Replace `text-gray-*` with `text-foreground` or `text-muted-foreground`
2. Replace `bg-gray-*` with `bg-card` or `bg-muted`
3. Add `dark:` variants for special colors (green, red, yellow)

**Connect to real backend:**
1. Add API URL to `.env.local`
2. Update `lib/api.ts` functions one at a time
3. Replace `localStorage` with `fetch()` calls
4. Keep same function signatures - components don't change!

---

## 🎯 Summary

This codebase implements a complete payment infrastructure platform with:

**✅ Completed:**
- Full merchant dashboard with stats and activity
- Payment tracking and management
- Checkout link generation and management
- Customer-facing hosted checkout pages
- Withdrawal system
- API documentation and logs
- Dark mode implementation across all pages
- Reusable table components
- Single source of truth for currencies
- Type-safe TypeScript throughout

**🔄 In Progress (MVP):**
- localStorage for data (temporary)
- Simulated payment processing
- Mock Stellar transactions

**📦 Ready for Production:**
- Clean component architecture
- Centralized API layer (`lib/api.ts`)
- Easy backend migration path
- Comprehensive type safety
- DRY principles enforced

**Next:** Connect real payment processors and Stellar blockchain, migrate from localStorage to database.

---

*This documentation is maintained alongside the codebase. Last updated: April 2026*
