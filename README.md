# Internal Wallet Service

A production-grade internal wallet service for managing virtual currency (credits/points) in a closed-loop system. Built with double-entry bookkeeping, strict data integrity, and concurrency safety.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Validation:** Zod

## Architecture

### Double-Entry Ledger
Every transaction creates two ledger entries (debit + credit), ensuring the books always balance. Account balances are cached on the `accounts` table and derived from ledger entries.

### Concurrency Strategy
- **Row-level locking** (`SELECT ... FOR UPDATE`) prevents race conditions on balance updates
- **Deadlock avoidance** by always locking accounts in ascending UUID order
- **Optimistic concurrency control** via a `version` column as a secondary safeguard
- **Serializable transaction isolation** for the strongest consistency guarantees

### Idempotency
Every mutating endpoint requires an `Idempotency-Key` header. Duplicate requests return the original result without re-processing.

## Quick Start

### With Docker

```bash
docker compose up --build
```

This starts PostgreSQL, runs migrations, seeds data, and starts the app on port 3000.

### Local Development

```bash
# 1. Start PostgreSQL (or use docker compose up db)
# 2. Copy env
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Generate and run migrations
npm run db:generate
npm run db:migrate

# 5. Seed data
npm run db:seed

# 6. Start dev server
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/accounts` | Create user account |
| GET | `/api/v1/accounts/:id` | Get account details |
| GET | `/api/v1/accounts/:id/balance` | Get balance |
| GET | `/api/v1/accounts/:id/ledger` | Get ledger entries (paginated) |
| POST | `/api/v1/transactions/top-up` | Credit wallet (requires Idempotency-Key) |
| POST | `/api/v1/transactions/bonus` | Issue bonus credits (requires Idempotency-Key) |
| POST | `/api/v1/transactions/spend` | Spend credits (requires Idempotency-Key) |
| GET | `/api/v1/transactions/:id` | Get transaction details |
| GET | `/api/v1/transactions` | List transactions (filtered, paginated) |
| GET | `/api/v1/asset-types` | List asset types |

## Transaction Flows

### Top-Up (User purchases credits)
```
POST /api/v1/transactions/top-up
Headers: Idempotency-Key: <unique-key>
Body: { "accountId": "...", "assetTypeId": "...", "amount": 100 }
```
Treasury is debited, user wallet is credited.

### Bonus (System issues free credits)
```
POST /api/v1/transactions/bonus
Headers: Idempotency-Key: <unique-key>
Body: { "accountId": "...", "assetTypeId": "...", "amount": 50 }
```

### Spend (User spends credits)
```
POST /api/v1/transactions/spend
Headers: Idempotency-Key: <unique-key>
Body: { "accountId": "...", "assetTypeId": "...", "amount": 25 }
```
User wallet is debited, revenue account is credited. Fails if insufficient balance.

## Seed Data

- **Asset Types:** Gold Coins (GC), Diamonds (DM), Loyalty Points (LP)
- **System Accounts:** Treasury + Revenue per asset type
- **Users:** Alice (1000 GC, 50 DM, 500 LP), Bob (500 GC, 25 DM, 200 LP)
