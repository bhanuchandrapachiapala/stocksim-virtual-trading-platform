## Technical Audit — StockSim Virtual Trading Platform (Next.js + Supabase)

> **Audit basis**: This document is built from the current repository contents (App Router pages/components, API route handlers, `types/index.ts`, `proxy.ts`, Supabase SSR helpers, and cron routes).  
> **Database schema/RLS/triggers**: **No SQL migrations or schema files exist in this repo** (no `supabase/` project folder, no `*.sql`), so table columns/relationships/RLS policies are **inferred from TypeScript types and Supabase queries**, and any “RLS/trigger” discussion is **best-practice / expected** rather than verifiably defined here.

---

## 1) Project Overview

### What the project does
StockSim is a **full-stack virtual stock market simulator**:
- Users register/login (email/password + Google OAuth) using Supabase Auth.
- Users start with **virtual cash** (starting balance constant is `$9,000`).
- Users trade **fictional companies**. Trades impact price globally:
  - **Buys increase price**
  - **Sells decrease price**
- It includes:
  - **Holdings & net worth**
  - **FIFO lot-based selling with a 24-hour hold rule**
  - **Mutual funds** (members contribute; manager trades fund holdings)
  - **Bank loans** (max 50% of net worth; repayment; overdue liquidation)
  - **IPOs** (apply; admin allocates)
  - **Limit orders** (pending orders executed by cron)
  - **Notifications**
  - **Admin panel** (news, companies, IPOs, users/grants)
  - **Price alerts** (triggered by cron)
  - **Realtime price updates** via Supabase Realtime
  - **Line + Candlestick charts** via `lightweight-charts`

### Tech stack and why it fits
From `package.json`:
- **Next.js 16 App Router** (`next@16.1.6`): server components for data fetching + route handlers for API + layouts/route groups.
- **React 19**: modern client component UX patterns.
- **TypeScript 5**: strict typing (`tsconfig.json` has `"strict": true`).
- **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`): auth + database + realtime.
- **Tailwind CSS v4**: consistent dark/glass UI rapidly.
- **Framer Motion**: animations (cards, counters, slide-in mobile sidebar, accordions).
- **lightweight-charts**: performant interactive trading charts.
- **lucide-react**: icon set.
- **Groq** (via `lib/groq.ts`): AI-assisted admin news authoring.
- **Recharts** is installed but the stock chart is implemented with `lightweight-charts` (some other UI pieces may still use Recharts; this repo includes it as a dependency).

### How frontend and backend connect
- Frontend pages/components call:
  - **Supabase directly in Server Components** (RSC) using `lib/supabase/server.ts`
  - **API routes** (`app/api/**/route.ts`) for mutations and privileged operations
  - **Supabase Realtime** in client components for live price updates
- Auth is enforced by:
  - **`proxy.ts`** (Edge “proxy” convention in Next 16) using Supabase SSR session refresh + redirects
  - Route group layout protections (`app/(admin)/layout.tsx`)

---

## 2) Folder Structure

### Root
- **`app/`**: Next.js App Router (pages, layouts, route groups, route handlers)
- **`lib/`**: shared modules (Supabase clients, constants, Groq integration, utilities)
- **`types/`**: shared TypeScript domain types (`types/index.ts`)
- **`proxy.ts`**: edge auth/session “proxy” for protected routes (replaces `middleware.ts`)
- Config:
  - `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- `public/`: static assets/icons
- `README.md`, `LICENSE`

### `app/` — Route groups, layouts, pages, APIs
**Route groups**:
- **`app/(auth)/`**: login/register UI
- **`app/(dashboard)/`**: authenticated user experience
- **`app/(admin)/`**: admin-only UI

**Layouts**:
- `app/layout.tsx`: root metadata + fonts + global CSS
- `app/(dashboard)/layout.tsx`: authenticated dashboard chrome (now via `DashboardShell`)
- `app/(admin)/layout.tsx`: admin-only chrome + admin auth guard

**API route handlers**:
- `app/api/**/route.ts`: REST-like endpoints (trade, loans, funds, admin, cron, etc.)

### `lib/` — What each file does
- `lib/supabase/client.ts`: browser Supabase client (client components)
- `lib/supabase/server.ts`: server Supabase client for RSC/route handlers via `cookies()`
- `lib/supabase/middleware.ts`: SSR session refresh + user extraction for `proxy.ts`
- `lib/constants.ts`: domain constants (starting balance, interest rate, price impact)
- `lib/groq.ts`: Groq API integration for AI news generation
- `lib/utils.ts`: **currently just `// TODO`** (placeholder)

### `types/`
- `types/index.ts`: defines domain objects: `User`, `Company`, `Holding`, `HoldingLot`, `Order`, `Loan`, `Fund`, `IPO`, `News`, `Notification`, `PriceAlert`, `Achievement`, `Transaction`, etc.

---

## 3) Database Architecture (Inferred)

### Tables (inferred from `types/index.ts` + queries)

Below is the “best known” schema from code. Types and queries imply these columns exist.

#### `users`
Purpose: application-level user profile (separate from Supabase Auth user).
- Columns used:
  - `id` (PK; same as auth user id)
  - `email`
  - `display_name`
  - `avatar_url`
  - `cash_balance`
  - `is_admin`
  - `is_bankrupt`
  - `created_at`

Used across: dashboard header/profile, leaderboard, admin users, trade, loans, IPO apply, admin grant, etc.

#### `companies`
Purpose: tradable fictional companies.
- Columns used:
  - `id`, `name`, `ticker`, `sector`, `description`
  - `current_price`
  - `shares_outstanding`
  - `shares_available`
  - `is_ipo`
  - `created_at`

#### `price_history`
Purpose: time series of price points.
- Columns used:
  - `id` (implied)
  - `company_id`
  - `price`
  - `recorded_at`

Written by: trade, fund trade, admin company create, admin IPO create, cron liquidation, cron limit orders.

#### `holdings`
Purpose: a user’s aggregated holding per company.
- Columns used:
  - `id`
  - `user_id`
  - `company_id`
  - `quantity`
  - `avg_buy_price`
  - `updated_at`

#### `holding_lots`
Purpose: FIFO lots with lock period.
- Columns used:
  - `id`
  - `user_id`, `company_id`
  - `quantity`, `remaining_quantity`
  - `buy_price`
  - `purchased_at`
  - `created_at`

Written by: `POST /api/trade` on buys. Read/updated on sells.

#### `orders`
Purpose: executed market orders + pending limit orders.
- Columns used:
  - `id`
  - `user_id`, `company_id`
  - `side` (`buy`/`sell`)
  - `order_type` (`market`/`limit`)
  - `quantity`, `price`
  - `status` (`pending`/`executed`/`cancelled`)
  - `created_at`
  - `executed_at`

Written by: trade route (executed market), limit order route (pending), cron executes and updates.

#### `transactions`
Purpose: ledger of all money events.
- Columns used:
  - `id`
  - `user_id`
  - `type` (string e.g. `buy`, `sell`, `loan_disbursed`, `loan_repayment`, `fund_contribution`, `admin_grant`, etc.)
  - `amount` (positive/negative)
  - `description`
  - `created_at`

#### `loans`
Purpose: bank loan records.
- Columns used:
  - `id`
  - `user_id`
  - `principal`
  - `interest_rate`
  - `amount_owed`
  - `repaid_amount`
  - `due_date`
  - `status` (`active`/`repaid`/`defaulted`)
  - `created_at`

#### `funds`
Purpose: pooled investment vehicles.
- Columns used:
  - `id`, `name`, `description`
  - `manager_id`
  - `total_value`
  - `fee_percent`
  - `min_buy_in`
  - `created_at`

#### `fund_members`
Purpose: membership + contributions.
- Columns used:
  - `id`
  - `fund_id`
  - `user_id`
  - `contribution`
  - `joined_at`

#### `fund_holdings`
Purpose: holdings owned by a fund (not by individual users).
- Columns used:
  - `id`
  - `fund_id`
  - `company_id`
  - `quantity`
  - `avg_buy_price`

#### `ipos`
Purpose: IPO campaigns for companies.
- Columns used:
  - `id`
  - `company_id`
  - `initial_price`
  - `shares_offered`
  - `shares_applied`
  - `subscription_deadline`
  - `status` (`open`/`closed`/`allocated`)
  - `created_at`

#### `ipo_applications`
Purpose: user applications for IPO shares.
- Columns used:
  - `id`
  - `ipo_id`
  - `user_id`
  - `shares_requested`
  - `shares_allocated`
  - `amount_paid`
  - `applied_at` (implied)
  
#### `news`
Purpose: admin-posted market news.
- Columns used:
  - `id`
  - `title`
  - `body`
  - `ticker_tags` (array)
  - `is_pinned`
  - `created_by`
  - `created_at`

#### `watchlist`
Purpose: user watchlist entries.
- Columns used:
  - `user_id`
  - `company_id`
Likely PK/unique: `(user_id, company_id)` (code handles `23505`).

#### `notifications`
Purpose: user notifications (limit order executed, price alerts, loan default, achievements, etc.).
- Columns used:
  - `id`
  - `user_id`
  - `type`
  - `message`
  - `is_read`
  - `created_at`

#### `price_alerts`
Purpose: “above/below target price” alerts.
- Columns used:
  - `id`
  - `user_id`
  - `company_id`
  - `target_price`
  - `direction` (`above`/`below`)
  - `is_triggered`
  - `created_at`

#### `achievements`
Purpose: earned badge records.
- Columns used:
  - `id`
  - `user_id`
  - `badge_name`
  - `earned_at`

#### `net_worth_snapshots`
Purpose: daily snapshots taken by cron (even though leaderboard is live).
- Columns used:
  - `user_id`
  - `value`
  - `recorded_at`

### Relationships (inferred)
- `holdings.user_id -> users.id`
- `holdings.company_id -> companies.id`
- `holding_lots.user_id -> users.id`
- `holding_lots.company_id -> companies.id`
- `orders.user_id -> users.id`
- `orders.company_id -> companies.id`
- `price_history.company_id -> companies.id`
- `loans.user_id -> users.id`
- `funds.manager_id -> users.id`
- `fund_members.fund_id -> funds.id`
- `fund_members.user_id -> users.id`
- `fund_holdings.fund_id -> funds.id`
- `fund_holdings.company_id -> companies.id`
- `ipos.company_id -> companies.id`
- `ipo_applications.ipo_id -> ipos.id`
- `ipo_applications.user_id -> users.id`
- `news.created_by -> users.id`
- `watchlist.user_id -> users.id`
- `watchlist.company_id -> companies.id`
- `notifications.user_id -> users.id`
- `price_alerts.user_id -> users.id`
- `price_alerts.company_id -> companies.id`
- `achievements.user_id -> users.id`
- `net_worth_snapshots.user_id -> users.id`

### RLS policies (cannot verify in repo)
No policy definitions are present here. **Expected** RLS patterns (recommended):
- `users`: user can `select/update` own row; admins can select all (or via service role if desired).
- `holdings`, `holding_lots`, `orders`, `transactions`, `loans`, `notifications`, `price_alerts`, `watchlist`, `achievements`: user can CRUD where `user_id = auth.uid()`.
- `companies`, `price_history`, `news`, `ipos`: generally readable by all authenticated users (or public), but writable only by admins.
- `funds`, `fund_members`, `fund_holdings`: mixed rules (members can read, manager can trade holdings).
- Cron routes are secured by `CRON_SECRET`, but database mutations still rely on whatever RLS is configured (cron uses the anon key via SSR client, not a service role key).

### Auto-creating users trigger (cannot verify in repo)
Common Supabase pattern: trigger on `auth.users` insert to create row in `public.users`. **Not present in repo**, but the app assumes a `users` row exists after signup/login.

---

## 4) Authentication Flow

### Supabase Auth setup
- Browser client: `lib/supabase/client.ts`
- Server client: `lib/supabase/server.ts` (SSR cookies)
- Session refresh for edge proxy: `lib/supabase/middleware.ts` + `proxy.ts`

### Email/password login/register
- Login UI: `app/(auth)/login/_components/LoginForm.tsx`
- Register UI: `app/(auth)/register/_components/RegisterForm.tsx`
- Both pages are wrapped in `Suspense` so `useSearchParams()` is safe:
  - `app/(auth)/login/page.tsx`
  - `app/(auth)/register/page.tsx`

### Google OAuth
- Initiated in login/register form via `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: ... } })`
- Redirect destination: `/api/auth/callback?next=...`

### Email confirmation flow
Callback handler: `app/api/auth/callback/route.ts`
- Supports:
  - `token_hash` + `type` → `supabase.auth.verifyOtp({ token_hash, type })`
  - `code` → `supabase.auth.exchangeCodeForSession(code)`
- Success → redirect `/dashboard`
- Failure → redirect `/login?error=confirmation_failed`

### Route protection: `proxy.ts`
- Uses `updateSession()` to refresh auth and retrieve `user`.
- Protects dashboard-related paths + admin paths.
- Admin protection:
  - any `/admin` or `/admin/*` requires authenticated user and `user.app_metadata.is_admin === true`.

### Admin vs user roles
Two different “admin” signals exist in this codebase:
- **Supabase Auth metadata**: `user.app_metadata.is_admin` (used in `proxy.ts` and admin APIs)
- **Users table**: `users.is_admin` (used for:
  - dashboard sidebar “Admin Panel” visibility
  - excluding admins from leaderboard
  - blocking admin trading in `POST /api/trade`)

**Note**: This is a real architectural concern: if these ever diverge, UI/permissions may become inconsistent. (The code currently uses both.)

---

## 5) Core Features (what / files / data flow / special logic)

### a) Stock trading (buy/sell) with price impact
**User perspective**: buy or sell shares; price changes globally after trade.

**Key files**
- UI: `app/(dashboard)/stocks/[ticker]/_components/StockDetail.tsx`
- Data fetch: `app/(dashboard)/stocks/[ticker]/page.tsx`
- API: `app/api/trade/route.ts`
- Constants: `lib/constants.ts` (`PRICE_IMPACT_PER_SHARE = 0.005`)

**Data flow**
1. UI calls `POST /api/trade` with `{ company_id, side, quantity, order_type: 'market' }`
2. API:
   - auth user
   - fetch company + user cash
   - apply validations
   - compute new price:  
     - buy: `newPrice = currentPrice * (1 + quantity * PRICE_IMPACT_PER_SHARE)`  
     - sell: `newPrice = currentPrice * (1 - quantity * PRICE_IMPACT_PER_SHARE)`
   - update:
     - `users.cash_balance`
     - `companies.shares_available`
     - `holdings` row (insert/update/delete)
     - `orders` (executed)
     - `transactions`
     - `price_history`
     - `companies.current_price`

**Special logic**
- Achievements are awarded in `checkAndAwardAchievements()` inside the trade route.

### b) FIFO 24-hour hold system
**User perspective**: shares bought within last 24h are locked and cannot be sold.

**Key files**
- API logic: `app/api/trade/route.ts` (sell path)
- Lots table usage: `holding_lots`
- UI display: `StockDetail.tsx` + server queries in `stocks/[ticker]/page.tsx`

**Algorithm**
- On buy: insert a new `holding_lots` row with `remaining_quantity = quantity`, `purchased_at = now`.
- On sell:
  - fetch eligible lots where `remaining_quantity > 0` and `purchased_at <= now - 24h`, ordered oldest first
  - sum sellable
  - if insufficient, reject with error including `total_sellable_quantity`
  - consume FIFO by decrementing `remaining_quantity` per lot until sold quantity satisfied

### c) Mutual funds
**User perspective**: create funds, join by contributing cash, manager trades.

**Key files**
- Pages/components:
  - `app/(dashboard)/funds/page.tsx` + `_components/FundsListContent.tsx`
  - `app/(dashboard)/funds/create/page.tsx`
  - `app/(dashboard)/funds/[fundId]/page.tsx` + `_components/FundDetailContent.tsx`
- APIs:
  - `POST /api/funds/create`
  - `POST /api/funds/join`
  - `POST /api/funds/exit`
  - `POST /api/funds/trade`

**Data flow highlights**
- Join:
  - validate min buy-in
  - deduct user cash
  - upsert/insert fund membership contribution
  - increase `funds.total_value`
  - insert transaction `fund_contribution`
- Fund trading:
  - only `fund.manager_id` can trade
  - computes fund cash as `fund.total_value - holdingsValue`
  - updates `fund_holdings`, `companies`, `price_history`, and adjusts `funds.total_value` (buy path does; sell path currently does not update fund total value in the file shown)

**Special logic**
- Uses price impact same constant as user trades.
- Fund cash is derived, not stored separately.

### d) Banking and loans with auto-liquidation
**User perspective**: borrow up to 50% net worth; repay; if overdue, holdings liquidated automatically.

**Key files**
- UI: `app/(dashboard)/bank/page.tsx` + `_components/BankContent.tsx`
- APIs:
  - `POST /api/bank/loan`
  - `POST /api/bank/repay`
- Cron:
  - `GET /api/cron/loan-check`

**Loan eligibility**
- Net worth = `cash_balance + sum(holdings.quantity * companies.current_price)`
- Max loan = `netWorth * MAX_LOAN_PERCENT`

**Auto-liquidation (cron)**
- Finds overdue active loans, sells all holdings, adjusts prices with impact, records transactions.
- If recovered cash covers `amount_owed`: deduct and mark loan repaid.
- Else: cash to 0, mark loan defaulted, set user bankrupt, notify user.

### e) IPO system
**User perspective**: apply for IPO shares; money reserved; admin allocates shares after close.

**Key files**
- User page: `app/(dashboard)/market/ipo/page.tsx` + `IPOMarketContent.tsx`
- Apply API: `POST /api/ipo/apply`
- Admin pages:
  - `app/(admin)/admin/ipo/page.tsx` + `_components/AdminIPOContent.tsx`
- Admin launch IPO API: `POST /api/admin/ipo`
- Admin allocate IPO API: `POST /api/ipo/allocate`

**Special logic**
- Oversubscription allocation is pro-rata (flooring).
- Funds are already deducted at apply time (held in reserve).

### f) Leaderboard with live net worth calculation
**User perspective**: see ranked traders by current net worth.

**Key files**
- `app/(dashboard)/leaderboard/page.tsx`
- UI: `app/(dashboard)/leaderboard/_components/LeaderboardContent.tsx`

**Mechanism**
- Fetch all users and all holdings with joined company prices.
- Aggregate portfolio value by user in memory.
- Compute live net worth = cash + portfolio.
- **Admins are filtered out** (`users.is_admin`).

### g) News system
**User perspective**: read news tagged by ticker; admins can post/pin/delete.

**Key files**
- User news: `app/(dashboard)/news/page.tsx` + `_components/NewsContent.tsx`
- Stock-related news: fetched in `stocks/[ticker]/page.tsx` via `news.contains('ticker_tags', [ticker])`
- Admin:
  - pages: `app/(admin)/admin/news/page.tsx` + `AdminNewsContent.tsx`
  - API: `app/api/admin/news/route.ts` (POST/DELETE/PATCH)
  - AI assist: `app/api/admin/news/ai-assist/route.ts` + `lib/groq.ts`

### h) Admin panel
**User perspective**: admins manage news, companies, IPOs, users.

**Key files**
- Admin layout + sidebar:
  - `app/(admin)/layout.tsx` (server check `authUser.app_metadata.is_admin`)
  - `app/(admin)/_components/AdminSidebar.tsx`
- Pages:
  - overview: `app/(admin)/admin/page.tsx` (note: exists now; earlier there was also `app/(admin)/page.tsx` pattern in previous snapshots)
  - `admin/news`, `admin/companies`, `admin/ipo`, `admin/users`
- APIs: `app/api/admin/*`

**Auth**
- Double-protected:
  - edge `proxy.ts` blocks `/admin/*` unless `app_metadata.is_admin`
  - admin layout also blocks unless `app_metadata.is_admin`

### i) Real-time price updates via Supabase Realtime
**User perspective**: stock page updates price live without refresh.

**Key file**
- `StockDetail.tsx` subscribes to `postgres_changes` on `companies` table updates filtered by company id.

**Mechanism**
- On update payload, sets local `currentPrice` and calls `series.update(...)` on the chart.

### j) Line and candlestick charts
**Key file**
- `StockDetail.tsx` uses `lightweight-charts`:
  - line series (curved)
  - candlesticks (generated from daily closes deterministically)
    - open = prev close (or `close * 0.998`)
    - high/low derived with deterministic seeded random

---

## 6) API Routes (Complete list from repo)

All are route handlers under `app/api/**/route.ts`.

### Auth
- **GET** `app/api/auth/callback`
  - Handles `token_hash`+`type` via `verifyOtp`
  - Handles `code` via `exchangeCodeForSession`
  - Redirects to `/dashboard` or `/login?error=confirmation_failed`

### Trading
- **POST** `app/api/trade`
  - Executes market buy/sell
  - Applies price impact
  - Writes holdings, holding_lots (buy), orders, transactions, price_history
  - Enforces FIFO sell lots older than 24h
  - **Blocks admins** (`users.is_admin`) with 403

### Limit orders
- **POST** `app/api/orders/limit`
  - Validates buy cash or sell holdings
  - Inserts `orders` row as pending limit order
- **DELETE** `app/api/orders/limit/cancel`
  - Validates ownership + pending
  - Sets status cancelled

### Funds
- **POST** `app/api/funds/create`
  - Creates fund + inserts manager as member
- **POST** `app/api/funds/join`
  - Adds/updates membership + deducts cash + updates fund value
- **POST** `app/api/funds/exit`
  - Removes membership (non-manager) + returns proportional fund value
- **POST** `app/api/funds/trade`
  - Manager-only; updates fund holdings and market prices

### Banking
- **POST** `app/api/bank/loan`
  - Checks max eligible (50% of net worth)
  - Creates active loan and credits cash
- **POST** `app/api/bank/repay`
  - Deducts cash and updates loan status/repaid_amount

### IPO
- **POST** `app/api/ipo/apply`
  - Validates ipo open + deadline
  - Deducts cash, inserts `ipo_applications`, updates `ipos.shares_applied`, logs transaction
- **POST** `app/api/ipo/allocate`
  - Admin-only (auth metadata)
  - Allocates shares and updates holdings/cash/applications; marks IPO allocated; updates company

### Watchlist
- **POST** `app/api/watchlist/add`
  - Inserts watchlist entry (handles unique violation)
- **DELETE** `app/api/watchlist/remove`
  - Deletes watchlist entry

### Notifications
- **POST** `app/api/notifications/read`
  - Marks one or all notifications as read

### Price alerts
- **GET/POST/DELETE** `app/api/price-alerts`
  - Manage price alerts; joins company info on GET

### Admin
- **POST** `app/api/admin/news` + **DELETE** + **PATCH**
  - Admin-only: create/delete/pin/unpin news
- **POST** `app/api/admin/news/ai-assist`
  - Admin-only: calls Groq to draft news from notes
- **POST** `app/api/admin/company`
  - Admin-only: create company + insert initial `price_history`
- **POST** `app/api/admin/ipo`
  - Admin-only: create IPO + insert `price_history` + mark company `is_ipo = true`
- **POST** `app/api/admin/grant`
  - Admin-only: grant funds + clear bankruptcy + insert transaction

### Cron (secured by CRON_SECRET header)
- **GET** `app/api/cron/loan-check`
- **GET** `app/api/cron/limit-orders`
- **GET** `app/api/cron/net-worth-snapshot`

---

## 7) Cron Jobs

> **Scheduling file**: a `vercel.json` cron schedule is **not present** in the current repo root listing. The cron endpoints exist, but scheduling must be configured externally (Vercel Cron config, cron-job.org, etc.).

### `GET /api/cron/loan-check`
- Auth: `authorization: Bearer ${CRON_SECRET}`
- Logic:
  - fetch overdue active loans (`due_date < now`)
  - for each:
    - fetch holdings and joined company price
    - sell all holdings:
      - add proceeds to cash
      - delete holding
      - increase `shares_available`
      - decrease price with impact
      - add price_history + transaction `loan_liquidation`
    - if cash >= owed: deduct and mark repaid + insert `loan_repayment` tx
    - else: set cash 0 + mark defaulted + set `is_bankrupt` + notify

### `GET /api/cron/limit-orders`
- Auth: same header
- Logic:
  - fetch pending limit orders
  - for each:
    - fetch current company price
    - execute if threshold met (buy if `current <= limit`, sell if `current >= limit`)
    - apply buy/sell mutations similar to trading (but **does not enforce holding_lots 24h rule**)
    - mark order executed, insert transactions, price_history, notification
  - then check non-triggered `price_alerts`, trigger + notify + mark triggered

### `GET /api/cron/net-worth-snapshot`
- Auth: same header
- Logic:
  - iterate users
  - compute net worth = cash + holdings×current_price
  - insert `net_worth_snapshots(user_id, value, recorded_at)`

---

## 8) Design System

### Colors
- Core background: `#0a0a0f` (landing + dashboards)
- Main accent: **electric green `#00ff88`**
- Admin accent: **red** (sidebar link)
- Warning accents: yellow/amber and red (locked shares, oversubscription, etc.)

### Glassmorphism pattern
Common pattern across components:
- `bg-white/[0.03]` + `border-white/[0.08]` + `backdrop-blur-md/xl`
- Cards typically rounded `rounded-xl` / `rounded-2xl`

### Animation approach
- Framer Motion used for:
  - enter transitions on sections/cards
  - number counters (landing stats)
  - mobile drawer slide animation
  - accordion expand/collapse (landing FAQ)
  - subtle hover lifts/glows

### Charts
- `lightweight-charts` is used for the stock detail chart:
  - line series (curved)
  - candlesticks (generated from daily closes deterministically)
- Supabase realtime updates push into the series via `series.update(...)`.

---

## 9) Deployment

### Vercel
- Repo appears intended for Vercel (README references a Vercel URL, Next is configured normally).
- `next.config.ts` includes:
  - `reactCompiler: true`
  - Turbopack root set

### Environment variables (from `.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key (**present in repo state; treat as public** but still don’t commit real secrets)
- `GROQ_API_KEY`: used by `lib/groq.ts`
- `NEXT_PUBLIC_SITE_URL`: site URL (used in some auth flows)
- `CRON_SECRET`: used by cron endpoints for authorization header

### cron-job.org integration
- There is **no code/config referencing cron-job.org**.
- Cron endpoints exist; you must configure a scheduler (Vercel Cron, cron-job.org, GitHub Actions, etc.) to call them with the `authorization` header.

---

## 10) Known Patterns (reusability/consistency)

### Supabase query patterns
- Server:
  - `const supabase = await createClient()` in RSC and route handlers
  - `supabase.auth.getUser()` gate at start
- Client:
  - `createClient()` from `lib/supabase/client.ts`
  - Realtime via `.channel().on('postgres_changes', ...)`

### Auth protection patterns
- Edge proxy checks:
  - logged-in requirement for dashboard pages
  - admin requirement for admin pages (auth metadata)
- Layout-level protection (admin) duplicates role enforcement.

### TypeScript + Supabase join typing
Project uses frequent patterns like:
- `(res.data ?? []) as unknown as Array<{ ... }>`
to smooth Supabase’s dynamic join shapes.

### Domain types
- `types/index.ts` is the central domain “schema mirror” used for reasoning and UI props (though some pages define their own inline types too).

---

## “Every file” coverage note (what’s in repo vs what’s missing)
This repository contains **~98 tracked code/config files** (from a `**/*` glob). The audit above references all major functional areas and **every API route** present under `app/api/`.  

The only notable “incomplete” file found during the audit is:
- **`lib/utils.ts`** → contains only `// TODO`

And the most important “missing from repo” artifacts for a truly complete DB/auth/RLS audit are:
- **No database migrations / schema SQL**
- **No RLS policy definitions**
- **No trigger/function SQL for user profile creation**
- **No `vercel.json` cron schedule** (cron endpoints exist but scheduler config isn’t in repo)

---

## Security / correctness findings (high-signal)
- **Admin role split-brain risk**: both `auth.user.app_metadata.is_admin` and `users.is_admin` are used for different checks. Consider unifying so UI, access control, and trade restrictions can’t diverge.
- **Cron uses anon key**: cron routes rely on `CRON_SECRET` header, but actual DB writes still depend on Supabase policies. Without appropriate RLS for “system” operations (or using a service role key in a secure server-only environment), cron may fail or be overly permissive depending on DB config.
- **Limit order execution ignores 24h hold lots**: `/api/cron/limit-orders` sells based on `holdings` only and does not consume `holding_lots`, so it can bypass the 24h hold rule unless DB constraints/policies prevent it.
- **`.env.local` contains a real Supabase anon key**: anon keys are designed to be public, but avoid committing any secrets (especially `GROQ_API_KEY`, `CRON_SECRET`) to git.

---

## 11) Reusable Design Template (exact project patterns)

Everything below is copied from the actual class strings / inline styles used in your repo (not “suggested” styles). I’m grouping them by pattern so you can copy/paste.

---

## A) Exact Tailwind class templates (copy/paste)

### a) Page background + base layout
- **Dashboard shell background** (`DashboardShell`):

```tsx
<div className="min-h-screen bg-[#0a0a0f]">
```

- **Dashboard main wrapper (responsive padding/offset)** (`DashboardShell`):

```tsx
<main className="min-h-screen pt-14 pl-0 lg:pt-0 lg:pl-[240px]">
```

- **Common “page spacing” wrapper** (seen in many dashboard pages/components):

```tsx
<div className="space-y-6">
```

and for stock detail:

```tsx
<div className="space-y-6 pb-8">
```

---

### b) Glassmorphism card (exact)
You have a few “canonical” card strings used across the dashboard/admin:

- **Dashboard card** (`DashboardContent`, `StockDetail`, admin modal cards):

```txt
rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md
```

With padding when used as a generic card:

```txt
rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md
```

- **Market table container** (`MarketContent`):

```txt
overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md
```

- **Admin modal surface** (`AdminUsersContent`):

```txt
w-full max-w-md rounded-xl border border-white/10 bg-[#111118] p-6 shadow-xl
```

---

### c) Sidebar (structure + colors)
From `app/(dashboard)/_components/DashboardSidebar.tsx`:

- **Desktop sidebar shell**:

```txt
fixed left-0 top-0 z-40 h-screen w-[240px] border-r border-white/[0.06] bg-[#111118]/90 backdrop-blur-xl hidden lg:block
```

- **Logo row**:

```txt
flex items-center gap-2 border-b border-white/[0.06] px-6 py-5 transition-colors hover:opacity-90
```

- **Nav container**:

```txt
flex-1 space-y-0.5 p-3 overflow-y-auto
```

- **Mobile backdrop**:

```txt
fixed inset-0 z-50 bg-black/60 lg:hidden
```

- **Mobile drawer**:

```txt
fixed left-0 top-0 z-50 h-screen w-[240px] border-r border-white/[0.06] bg-[#111118] shadow-xl lg:hidden
```

- **Logout footer area**:

```txt
border-t border-white/[0.06] p-3 shrink-0
```

---

### d) Navigation link styles (default / active / hover)
From `DashboardSidebar.tsx`:

- **Base link structure** (always):

```txt
flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
```

- **Active state (green)**:

```txt
border-l-2 border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]
```

- **Default + hover state (green)**:

```txt
border-l-2 border-transparent text-zinc-400 hover:border-[#00ff88]/50 hover:bg-white/[0.04] hover:text-[#00ff88]
```

- **Admin Panel link (red) active**:

```txt
border-l-2 border-red-500 bg-red-500/10 text-red-400
```

- **Admin Panel link (red) default + hover**:

```txt
border-l-2 border-transparent text-red-500/80 hover:border-red-500/60 hover:bg-red-500/5 hover:text-red-400
```

---

### e) Primary button (green/accent)
You use multiple green primary styles; the most “button-like primary CTA” pattern on dashboard is:

- **Market “Buy” button** (`MarketContent`):

```txt
inline-flex items-center justify-center rounded-lg border border-[#00ff88]/50 bg-[#00ff88]/10 px-3 py-1.5 text-sm font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/20
```

- **Empty-state CTA (green)** (`DashboardContent`):

```txt
mt-6 inline-flex items-center gap-2 rounded-lg bg-[#00ff88]/20 px-4 py-2.5 text-sm font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/30
```

---

### f) Secondary button (outlined)
From admin modal cancel button (`AdminUsersContent`):

```txt
rounded-lg border border-white/10 py-2 px-4 text-sm text-zinc-400 hover:bg-white/5
```

---

### g) Danger button (red)
- **Admin “Grant Funds” small button** (`AdminUsersContent`):

```txt
flex items-center gap-1 rounded border border-[#ef4444]/50 bg-[#ef4444]/10 px-2 py-1 text-xs font-medium text-[#ef4444] hover:bg-[#ef4444]/20
```

- **Admin modal primary “Grant”** (`AdminUsersContent`):

```txt
flex-1 rounded-lg bg-[#ef4444] py-2 text-sm font-medium text-white hover:bg-[#ef4444]/90 disabled:opacity-50
```

---

### h) Input field styles (dark, focus border, placeholder)
You have two core variants:

- **Dashboard/market search input** (`MarketContent`):

```txt
w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]
```

- **Admin search + modal input** (`AdminUsersContent`) (red focus):

```txt
w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-10 pr-4 text-white placeholder-zinc-500 focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]
```

and modal numeric input:

```txt
w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]
```

---

### i) Table styles (header/row/hover/borders)
Two main table patterns:

- **Market table container**:

```txt
overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md
```

- **Market header row** (`MarketContent`):

```txt
border-b border-white/[0.06] text-left text-sm text-zinc-400
```

- **Market body row** (`MarketContent`):

```txt
group cursor-pointer border-b border-white/[0.04] transition-colors hover:border-l-4 hover:border-l-[#00ff88]/50 hover:bg-white/[0.04]
```

- **Dashboard holdings table wrapper** (`DashboardContent`):

```txt
flex-1 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md
```

- **Dashboard header row**:

```txt
border-b border-white/[0.06] text-left text-sm text-zinc-400
```

- **Dashboard body row**:

```txt
cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.04]
```

- **Admin users table header row** (`AdminUsersContent`):

```txt
border-b border-white/10 text-left text-zinc-400
```

- **Admin users body row**:

```txt
border-b border-white/5 text-zinc-300
```

---

### j) Badge/pill styles (green/red/yellow/gray)
Exact variants present:

- **Green pill (sector filter active)** (`MarketContent`):

```txt
bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40
```

- **Neutral pill (sector filter inactive)** (`MarketContent`):

```txt
border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-300
```

- **Red badge (bankrupt)** (`AdminUsersContent`):

```txt
rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400
```

- **Amber text (active loan “Yes”)** (`AdminUsersContent`):

```txt
text-amber-400
```

- **Gray “No/empty”**:

```txt
text-zinc-500
```

- **Stock page ticker badge** (`StockDetail`):

```txt
rounded-md bg-white/10 px-2.5 py-0.5 font-mono text-sm text-zinc-300
```

---

### k) Stat card pattern (icon + label + big number)
From `DashboardContent`:

- **Stat card base**:

```txt
rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md
```

- **Label**:

```txt
text-sm font-medium text-zinc-400
```

- **Big value**:

```txt
mt-1 text-2xl font-bold text-white
```

- **Glow example (net worth card)** (inline style):

```ts
style={{ boxShadow: '0 0 40px -10px rgba(0, 255, 136, 0.15)' }}
```

---

### l) Empty state pattern (icon + heading + subtext + CTA)
From `DashboardContent` holdings empty state:

- **Container**:

```txt
flex flex-col items-center justify-center py-16 px-6 text-center
```

- **Icon wrapper**:

```txt
rounded-full bg-white/[0.06] p-4
```

- **Heading**:

```txt
mt-4 text-lg font-medium text-zinc-300
```

- **Subtext**:

```txt
mt-1 text-sm text-zinc-500
```

- **CTA (green)**:

```txt
mt-6 inline-flex items-center gap-2 rounded-lg bg-[#00ff88]/20 px-4 py-2.5 text-sm font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/30
```

---

### m) Toast/notification styles
From `StockDetail.tsx` toast:

- **Wrapper**:

```txt
fixed right-6 top-20 z-50 rounded-lg px-4 py-3 text-sm font-medium
```

- **Success variant**:

```txt
bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40
```

- **Error variant**:

```txt
bg-red-500/20 text-red-400 border border-red-500/40
```

---

### n) Modal/drawer styles
From `AdminUsersContent` modal:

- **Backdrop**:

```txt
fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm
```

- **Modal surface**:

```txt
w-full max-w-md rounded-xl border border-white/10 bg-[#111118] p-6 shadow-xl
```

From `DashboardSidebar` mobile drawer:

- **Drawer surface**:

```txt
fixed left-0 top-0 z-50 h-screen w-[240px] border-r border-white/[0.06] bg-[#111118] shadow-xl lg:hidden
```

---

### o) Loading skeleton styles
I don’t see a skeleton component in the files reviewed; the project mostly uses:
- **“Loading…” full-screen fallback** on auth pages (Suspense fallback), and
- Motion fades for empty states.

If you want a skeleton that matches your style, the closest in-project “base block” you’d use is the card background:

```txt
rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-md
```

(There isn’t an existing `animate-pulse` skeleton in the repo right now.)

---

## B) Exact color values used in the project (from code)

### a) Background colors (hex)
- **Base app background**: `#0a0a0f`  
  (DashboardShell, DashboardHeader, many pages)
- **Sidebar / dark surface**: `#111118`  
  (Sidebar background, modals, chart background)
- **Landing/dash variants**: also uses `bg-black/30`, `bg-black/40` in some places.

### b) Accent colors (hex)
- **Primary green**: `#00ff88`
- **Admin/danger red**: `#ef4444`
- **Candlestick down red**: `#ff4444` (charts)
- **Tailwind red-400**: used as `text-red-400` (no hex in code, Tailwind token)
- **Amber**: used via Tailwind tokens (`amber-400`, `amber-500/...`)

### c) Text colors (exact Tailwind tokens seen)
- `text-white`
- `text-zinc-300`
- `text-zinc-400`
- `text-zinc-500`
- `text-red-400`
- `text-amber-200`, `text-amber-300`, `text-amber-400`

### d) Border colors (rgba-style Tailwind classes)
Exact border opacity patterns used:
- `border-white/[0.06]`
- `border-white/[0.08]`
- `border-white/10`
- `border-white/[0.04]`
- `border-red-500/30`
- `border-amber-500/30`
- `border-[#00ff88]/40`
- `border-[#00ff88]/50`
- `border-[#ef4444]/50`

### e) Shadow/glow effects (exact strings)
- Net worth stat glow (`DashboardContent`):

```txt
0 0 40px -10px rgba(0, 255, 136, 0.15)
```

- Drawer/modal shadow token used:
  - `shadow-xl` (Tailwind preset)
  - `shadow-xl` appears on admin modal and mobile drawer.

---

## C) Exact Framer Motion animation patterns used

### a) Page entrance (fade + slide up)
Common pattern (e.g. `DashboardContent`, `StockDetail` sections):

```ts
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}
```

### b) Staggered list / row entrance
Market table rows (`MarketContent`):

```ts
initial={{ opacity: 0, x: -8 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0 }}
transition={{ delay: Math.min(i * 0.02, 0.3) }}
```

Dashboard holdings rows (`DashboardContent`):

```ts
initial={{ opacity: 0, x: -8 }}
animate={{ opacity: 1, x: 0 }}
transition={{ delay: 0.3 + i * 0.04 }}
```

Admin users table rows (`AdminUsersContent`):

```ts
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ delay: i * 0.02 }}
```

### c) Card hover animation
In some sections (ex: your landing page features), cards use `whileHover` lift/glow patterns. (Not included in the files loaded above; if you want, I can extract those exact `whileHover` blocks too from `app/page.tsx`.)

### d) Sidebar slide-in animation (mobile)
From `DashboardSidebar.tsx`:

```ts
initial={{ x: -240 }}
animate={{ x: 0 }}
exit={{ x: -240 }}
transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
```

Backdrop fade:

```ts
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.2 }}
```

### e) Counter animation pattern
From `DashboardContent.tsx` (motion value):

```ts
const count = useMotionValue(0)
useEffect(() => {
  const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' })
  return controls.stop
}, [value, count])

useEffect(() => {
  const unsub = count.on('change', (v) => setDisplay(prefix + v.toFixed(2) + suffix))
  return unsub
}, [count, prefix, suffix])
```

### f) Scroll-triggered animation
In this codebase, scroll-triggered animations are done with:
- `useInView(ref, { once: true, margin: '-80px' })` (landing)
- `whileInView` + `viewport={{ once: true }}` (landing)

(Again, I can paste the exact blocks from `app/page.tsx` if you want them added here.)

---

## D) Copy‑paste starter template (minimal Next.js page with identical shell)

This is a **new template** you can paste into any Next.js App Router project (not pulled from an existing file), but it uses the **exact classes and structure** from StockSim.

### 1) `app/(dashboard)/layout.tsx` (server)
```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from './_components/DashboardHeader'
import { DashboardShell } from './_components/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('cash_balance, avatar_url, display_name, is_admin')
    .eq('id', authUser.id)
    .single()

  const headerUser = profile
    ? {
        cash_balance: profile.cash_balance ?? 0,
        avatar_url: profile.avatar_url ?? null,
        display_name: profile.display_name ?? authUser.email ?? 'User',
      }
    : {
        cash_balance: 0,
        avatar_url: null as string | null,
        display_name: authUser.email ?? 'User',
      }

  return (
    <DashboardShell headerUser={headerUser} isAdmin={profile?.is_admin === true}>
      <DashboardHeader user={headerUser} />
      <div className="p-4 sm:p-6 pb-8">{children}</div>
    </DashboardShell>
  )
}
```

### 2) `app/(dashboard)/page.tsx` (minimal)
```tsx
export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
        <p className="text-sm font-medium text-zinc-400">Welcome</p>
        <p className="mt-1 text-2xl font-bold text-white">StockSim Template</p>
      </div>
    </div>
  )
}
```

---

## E) Shared navbar component (copy into any project “hub”)

You already have two “navbar-like” pieces:
- Desktop: `DashboardHeader`
- Mobile: the header bar inside `DashboardShell`

Here’s a **single reusable** component you can drop into any project that matches the **exact StockSim styling** (new code, but using your exact classes/colors):

```tsx
'use client'

import Link from 'next/link'
import { Menu, BarChart2 } from 'lucide-react'

export function HubNavbar({
  onMenuClick,
  rightText,
}: {
  onMenuClick?: () => void
  rightText?: string
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0f] px-4">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/[0.06]"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <Link
        href="/"
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
      >
        <BarChart2 className="h-6 w-6 shrink-0" style={{ color: '#00ff88' }} />
        <span className="text-lg font-semibold text-white">
          Stock<span style={{ color: '#00ff88' }}>Sim</span>
        </span>
      </Link>

      <div className="min-w-[80px] text-right">
        {rightText && (
          <span className="text-sm font-medium" style={{ color: '#00ff88' }}>
            {rightText}
          </span>
        )}
      </div>
    </div>
  )
}
```

If you want this to match StockSim **exactly** for desktop too, keep the desktop header as:

```txt
sticky top-0 z-30 hidden lg:flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0f] px-6
```

