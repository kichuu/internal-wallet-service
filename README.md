# Internal Wallet Service

A production-grade internal wallet service for managing virtual currency (credits/points) in a closed-loop system. Built with double-entry bookkeeping, strict data integrity, and concurrency safety.

## Live Deployment

**Base URL:** `http://assignmentjob-backenddino-vbpgi9-c66ed6-31-97-224-135.traefik.me`

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
| GET | `/api/v1/asset-types` | List all asset types |
| POST | `/api/v1/accounts` | Create user account |
| GET | `/api/v1/accounts/:id` | Get account details |
| GET | `/api/v1/accounts/:id/balance` | Get balance |
| GET | `/api/v1/accounts/:id/ledger` | Get ledger entries (paginated) |
| POST | `/api/v1/transactions/top-up` | Credit wallet (requires Idempotency-Key) |
| POST | `/api/v1/transactions/bonus` | Issue bonus credits (requires Idempotency-Key) |
| POST | `/api/v1/transactions/spend` | Spend credits (requires Idempotency-Key) |
| GET | `/api/v1/transactions/:id` | Get transaction details |
| GET | `/api/v1/transactions` | List transactions (filtered, paginated) |

## Testing with cURL

All examples use the live deployment. Replace `$BASE` with `http://assignmentjob-backenddino-vbpgi9-c66ed6-31-97-224-135.traefik.me` or set it as a variable:

```bash
BASE=http://assignmentjob-backenddino-vbpgi9-c66ed6-31-97-224-135.traefik.me
```

### Seed Data IDs

**Asset Types:**
| Name | Symbol | ID |
|------|--------|----|
| Gold Coins | GC | `a5a9361f-f114-4766-9a8c-ec9d18721a3d` |
| Diamonds | DM | `ee76aeed-35f7-4c4f-bc03-a0449529e04f` |
| Loyalty Points | LP | `e813970a-5e8f-4642-83de-bfd4e3d1dcc7` |

**User Accounts:**
| User | Asset | ID | Initial Balance |
|------|-------|----|-----------------|
| Alice | GC | `087f1d46-fd34-44e5-b3a2-521b1ab823f0` | 1000 |
| Alice | DM | `da19fd24-6808-464c-8947-376d46d0b331` | 50 |
| Alice | LP | `33ca3a3e-f647-40d2-8ae3-2794b09857b3` | 500 |
| Bob | GC | `b33b685c-54f4-478e-8a6f-40662521e044` | 500 |
| Bob | DM | `070ff224-d382-40a0-89a7-47d818539d89` | 25 |
| Bob | LP | `22d663ca-a0f3-4f58-8bcc-828d94438ef6` | 200 |

### 1. Health Check

```bash
curl $BASE/api/v1/health
```

### 2. List Asset Types

```bash
curl $BASE/api/v1/asset-types
```

### 3. Create a New User Account

```bash
curl -X POST $BASE/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com","assetTypeId":"a5a9361f-f114-4766-9a8c-ec9d18721a3d"}'
```

### 4. Get Account Details

```bash
curl $BASE/api/v1/accounts/087f1d46-fd34-44e5-b3a2-521b1ab823f0
```

### 5. Get Balance

```bash
curl $BASE/api/v1/accounts/087f1d46-fd34-44e5-b3a2-521b1ab823f0/balance
```

### 6. Top-Up (Add 200 Gold Coins to Alice)

Treasury is debited, Alice's wallet is credited.

```bash
curl -X POST $BASE/api/v1/transactions/top-up \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: topup-alice-gc-001" \
  -d '{
    "accountId": "087f1d46-fd34-44e5-b3a2-521b1ab823f0",
    "assetTypeId": "a5a9361f-f114-4766-9a8c-ec9d18721a3d",
    "amount": 200,
    "description": "Purchase 200 Gold Coins",
    "referenceId": "payment_abc123"
  }'
```

### 7. Bonus (Give Bob 100 Gold Coins)

Treasury is debited, Bob's wallet is credited.

```bash
curl -X POST $BASE/api/v1/transactions/bonus \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: bonus-bob-gc-001" \
  -d '{
    "accountId": "b33b685c-54f4-478e-8a6f-40662521e044",
    "assetTypeId": "a5a9361f-f114-4766-9a8c-ec9d18721a3d",
    "amount": 100,
    "description": "Welcome bonus"
  }'
```

### 8. Spend (Alice Spends 50 Gold Coins)

Alice's wallet is debited, Revenue account is credited.

```bash
curl -X POST $BASE/api/v1/transactions/spend \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: spend-alice-gc-001" \
  -d '{
    "accountId": "087f1d46-fd34-44e5-b3a2-521b1ab823f0",
    "assetTypeId": "a5a9361f-f114-4766-9a8c-ec9d18721a3d",
    "amount": 50,
    "description": "In-game purchase",
    "referenceId": "order_xyz789"
  }'
```

### 9. Idempotency Test (Duplicate Request)

Send the same top-up again with the same Idempotency-Key. Returns the original transaction — no duplicate processing.

```bash
curl -X POST $BASE/api/v1/transactions/top-up \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: topup-alice-gc-001" \
  -d '{
    "accountId": "087f1d46-fd34-44e5-b3a2-521b1ab823f0",
    "assetTypeId": "a5a9361f-f114-4766-9a8c-ec9d18721a3d",
    "amount": 200
  }'
```

### 10. Insufficient Balance (Should Fail)

Alice tries to spend more than her balance.

```bash
curl -X POST $BASE/api/v1/transactions/spend \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: spend-alice-gc-fail-001" \
  -d '{
    "accountId": "087f1d46-fd34-44e5-b3a2-521b1ab823f0",
    "assetTypeId": "a5a9361f-f114-4766-9a8c-ec9d18721a3d",
    "amount": 99999
  }'
```

### 11. Get Transaction by ID

Use a transaction ID from any of the above responses.

```bash
curl $BASE/api/v1/transactions/<transaction-id>
```

### 12. List Transactions (Paginated + Filtered)

```bash
# All transactions
curl "$BASE/api/v1/transactions?page=1&limit=10"

# Filter by account
curl "$BASE/api/v1/transactions?accountId=087f1d46-fd34-44e5-b3a2-521b1ab823f0&page=1&limit=10"

# Filter by type
curl "$BASE/api/v1/transactions?type=TOP_UP&page=1&limit=10"

# Filter by status
curl "$BASE/api/v1/transactions?status=COMPLETED&page=1&limit=10"
```

### 13. Get Ledger Entries (Account Statement)

```bash
curl "$BASE/api/v1/accounts/087f1d46-fd34-44e5-b3a2-521b1ab823f0/ledger?page=1&limit=10"
```

### 14. Verify Final Balance

After running top-up (+200) and spend (-50), Alice's GC balance should be 1150.

```bash
curl $BASE/api/v1/accounts/087f1d46-fd34-44e5-b3a2-521b1ab823f0/balance
```

### 15. Diamond Transactions (Multi-Asset Test)

```bash
# Top-up 30 Diamonds to Bob
curl -X POST $BASE/api/v1/transactions/top-up \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: topup-bob-dm-001" \
  -d '{
    "accountId": "070ff224-d382-40a0-89a7-47d818539d89",
    "assetTypeId": "ee76aeed-35f7-4c4f-bc03-a0449529e04f",
    "amount": 30,
    "description": "Purchase 30 Diamonds"
  }'

# Bob spends 10 Diamonds
curl -X POST $BASE/api/v1/transactions/spend \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: spend-bob-dm-001" \
  -d '{
    "accountId": "070ff224-d382-40a0-89a7-47d818539d89",
    "assetTypeId": "ee76aeed-35f7-4c4f-bc03-a0449529e04f",
    "amount": 10,
    "description": "Premium item purchase"
  }'

# Check Bob's Diamond balance (should be 45)
curl $BASE/api/v1/accounts/070ff224-d382-40a0-89a7-47d818539d89/balance
```

## Seed Data

- **Asset Types:** Gold Coins (GC), Diamonds (DM), Loyalty Points (LP)
- **System Accounts:** Treasury + Revenue per asset type
- **Users:** Alice (1000 GC, 50 DM, 500 LP), Bob (500 GC, 25 DM, 200 LP)
