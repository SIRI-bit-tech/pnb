# Prescott National Bank Online Banking System

Prescott National Bank is a highly secure, production-ready online banking platform designed to deliver institutional-grade financial workflows. It features peer-to-peer transfers, wire/ACH routing verification, multi-channel deposits, virtual card issuing, and stock portfolio trading with margin and short-selling capabilities.

---

## 1. System Architecture

Prescott National Bank utilizes a decoupled, API-first architecture designed to support **2,000+ concurrent users** with sub-200ms API latency:

```
┌──────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│   Next.js 16 App Router · shadcn/ui · TanStack Query     │
└──────────────┬────────────────────────────┬──────────────┘
               │                            │
               ▼                            ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│      Next.js Server       │  │        Ably Event         │
│   BetterAuth Validation   │  │       Subscription        │
│   Stytch OTP Verification │  │   Real-time balance,      │
│   proxy.ts API Middleware │  │   toasts & notifications  │
└──────────────┬────────────┘  └───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│                     FastAPI Engine                       │
│    Uvicorn ASGI · Async Database Session Pooling         │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│              Neon Serverless Postgres                    │
│   SSL Enforced · SQLAlchemy 2.0 Async · Alembic Migrations│
└──────────────────────────────────────────────────────────┘
```

### Key Architectural Guidelines
- **Frontend Isolation:** The Next.js frontend has zero direct database access. All data interactions flow through the FastAPI backend via secure API routes.
- **Middleware Proxying:** The Next.js `proxy.ts` middleware acts as an API gateway, verifying sessions, appending authentication headers, and performing client-side rate limiting.
- **Neon Scalability:** The database connection pool is configured with `pool_size=20` and `max_overflow=30` to guarantee high throughput during peak load.

---

## 2. Core Security Specifications

### 2.1 Password Hashing Topology (Salt + Pepper + Argon2id)
All user passwords undergo a multi-layered cryptographic compilation pipeline before persistence:

```
User Password ──┐
                ├──► [ password + salt + pepper ] ──► [ Argon2id Hashing ] ──► Stored Hash
Per-User Salt ──┤                                           ▲
Global Pepper ──┘                                           │
                                                Tuned Cost Parameters:
                                                - memory_cost: 64MB
                                                - time_cost: 3 rounds
                                                - parallelism: 4 threads
```

- **Per-User Salt:** A cryptographically secure, random 32-character hex salt is generated during registration for every user and saved in their DB row.
- **Server Pepper:** A global secret key (`PEPPER_KEY`) loaded from the server environment `.env` variables. **Never committed to version control and never stored in the database.**
- **Argon2id Hasher:** Configured via `argon2-cffi` to execute slow hashing (approx. 250ms per iteration) to defeat brute-force and rainbow-table attacks.

### 2.2 Data Encryption at Rest
- Sensitive cardholder information (virtual card numbers, CVVs) is encrypted at rest using **AES-256-GCM** via the `cryptography` module.
- Decryption keys are managed strictly in the backend execution context.

---

## 3. Real-Time Topology (Ably Event Grid)

Platform state updates utilize Ably's pub/sub architecture to bypass slow pulling cycles and keep UI elements alive:

| Channel Pattern | Publisher | Subscriber | Event Trigger |
|---|---|---|---|
| `user:{userId}:balance` | FastAPI | Next.js Dashboard | `balance.updated` (instant balance update) |
| `user:{userId}:notifications` | FastAPI | Next.js Toaster / Bell | `notification.new` (real-time in-app toast alerts) |
| `stocks:prices` | FastAPI Cron | Next.js Stock Ticker | `price.update` (real-time stock pricing stream) |
| `admin:deposits` | FastAPI | Next.js Admin Dashboard | `deposit.new` (alerts admin of new pending deposits) |
| `admin:cards` | FastAPI | Next.js Admin Dashboard | `card.request.new` (alerts admin of virtual card requests) |

---

## 4. Multi-Region & Multi-Currency Engine

Prescott National Bank natively supports US, Canada, and UK geographical profiles:
- **Automatic Localization:** User country selection determines local currency code: `USD` ($) for US, `CAD` ($) for CA, and `GBP` (£) for UK.
- **Cross-Currency Transfers:** In-app P2P transfers between accounts with differing local currencies are processed through a backend currency exchange converter with standard conversion metrics.
- **Address Formatting:** State dropdown lists auto-populate based on selected country (US states vs. CA provinces vs. UK regions). Manual zip codes validate against country-specific regular expressions (ZIP+4 for US, `A1A 1A1` for Canada, and standard postcode rules for the UK).

---

## 5. Storage Topology (UploadThing Integration)

Check deposit documents and profile avatars are handled asynchronously:
- **Async Thread Execution:** Uploads run on worker threads using `anyio.to_thread.run_sync` to keep the main ASGI event loop unblocked.
- **Storage Enclosure:** Uploaded assets are organized securely via the UploadThing client.
- **Access Control:** Content delivery uses secure, HTTPS-enforced (`https://utfs.io/f/...`) URLs.

---

## 6. UI Design Token System

The frontend utilizes a strict, cohesive token system mapping back to the principal design guidelines:

### Colors (Cobalt Sky Theme)
- `primary`: `#0047AB` (Bright Cobalt)
- `primary-dark`: `#000080` (Deep Navy / Header & Sidebar background)
- `primary-light`: `#82C8E5` (Sky Blue / Info alerts)
- `primary-muted`: `#6D8196` (Slate Gray / Placeholder text)
- `success`: `#16A34A` (Green success toast / Positive balance indicators)
- `error`: `#DC2626` (Red error toast / Stock losses / Validation warnings)

### Typography
- **Headings & Page Titles:** **Outfit** (500, 600, 700 weights) for clean, institutional structure.
- **Body & Captions:** **Plus Jakarta Sans** (400, 500, 600 weights) for optimal readable text.
- **Financial Balances & Card Details:** **JetBrains Mono** (400, 500 weights) for precise alignment of tabular numbers.

---

## 7. Operational API Spec

The API catalog is organized into isolated, dependency-injected routers:

### Authentication (`/api/auth`)
- `POST /register`: Registers users and pings Stytch for OTP.
- `POST /login`: Validates password and triggers Stytch OTP.
- `POST /verify-otp`: Confirms OTP code and returns encrypted session token.
- `GET /me`: Fetches authenticated profile payload.

### Banking Operations (`/api/transfers`, `/api/deposits`)
- `POST /transfers/p2p`: Instantly transfers funds to another user. Uses row-level lock (`with_for_update`) to prevent race conditions.
- `GET /transfers/history`: Fetches paginated transaction records.
- `POST /deposits/check`: Multipart form check images upload.
- `POST /deposits/cashapp` / `POST /deposits/paypal`: User declared deposit confirmation request.
- `GET /deposits/history`: Current user's deposit request status log.

### User Configuration (`/api/settings`, `/api/notifications`)
- `PATCH /settings/profile`: Modifies name, username, and address (re-evaluates validations).
- `POST /settings/profile/avatar`: Uploads avatar image.
- `PATCH /settings/notifications`: Updates notification toggles.
- `GET /notifications`: Fetches user alerts history.

### Admin Dashboard (`/api/admin`)
- `GET /admin/deposits`: Accesses list of pending deposits.
- `PATCH /admin/deposits/{id}`: Confirms/rejects deposit request (credits user balance).
- `PUT /admin/config/{key}`: Sets deposit credentials (CashApp tag/PayPal details).
- `POST /admin/config/upload-qr`: Uploads payment QR codes.
- `GET /admin/analytics`: Operational KPIs (average processing time, total volume).

---

## 8. Getting Started

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.12+ | Required — matches `pyproject.toml` |
| Poetry | 2.x | Dependency manager (`pip install poetry`) |
| Node.js | 18+ | Required for the frontend |
| Bun | Latest | Frontend package manager (`npm install -g bun`) |

---

### 8.1 Backend — FastAPI

All commands below are run from the **`backend/`** directory.

#### Step 1 — Create & activate the virtual environment

```bash
cd backend

# Create the venv with Poetry
poetry install

# Activate it (Windows PowerShell)
.\venv\Scripts\activate

# Activate it (Mac / Linux)
source venv/bin/activate
```

> **Alternative (no Poetry):** If you prefer plain pip —
> ```bash
> python -m venv venv
> .\venv\Scripts\activate        # Windows
> pip install -r requirements.txt
> ```

---

#### Step 2 — Configure environment variables

```bash
# Copy the template and fill in your real keys
copy .env.example .env      # Windows
cp .env.example .env        # Mac / Linux
```

Open `.env` and fill in at minimum:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | [Neon Console](https://console.neon.tech) → Connection string |
| `STYTCH_PROJECT_ID` | [Stytch Dashboard](https://stytch.com/dashboard) → API Keys |
| `STYTCH_SECRET` | Same as above |
| `BETTER_AUTH_SECRET` | Generate: `openssl rand -hex 32` |
| `RESEND_API_KEY` | [Resend Dashboard](https://resend.com/api-keys) |
| `PEPPER_KEY` | Generate: `openssl rand -hex 32` |

---

#### Step 3 — Run database migrations

```bash
# Applies all pending Alembic schema migrations to your Neon database
.\venv\Scripts\python.exe -m alembic upgrade head     # Windows
python -m alembic upgrade head                         # Mac / Linux
```

To check current migration status:

```bash
.\venv\Scripts\python.exe -m alembic current          # Windows
python -m alembic current                              # Mac / Linux
```

---

#### Step 4 — Start the development server

```bash
# Windows
.\venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000

# Mac / Linux
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

taskkill /F /IM python.exe

```

The API will be live at:
- **API base:** `http://localhost:8000`
- **Interactive docs (Swagger):** `http://localhost:8000/docs`
- **Alternative docs (Redoc):** `http://localhost:8000/redoc`

---

### 8.2 Frontend — Next.js

All commands below are run from the **`frontend/`** directory.

#### Step 1 — Install dependencies

```bash
cd frontend
bun install
```

#### Step 2 — Configure environment variables

```bash
copy .env .env.local      # Windows — then fill in real values
cp .env .env.local        # Mac / Linux
```

Key variables to fill in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` for local dev |
| `NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN` | [Stytch Dashboard](https://stytch.com/dashboard) → Public Token |
| `NEXT_PUBLIC_ABLY_API_KEY` | [Ably Dashboard](https://ably.com/dashboard) |
| `BETTER_AUTH_SECRET` | Same value as the backend `BETTER_AUTH_SECRET` |

#### Step 3 — Start the development server

```bash
bun run dev
```

Frontend available at: `http://localhost:3000`

---

### 8.3 Running Both Together (Full Stack)

Open two terminal windows:

```bash
# Terminal 1 — Backend
cd backend
.\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
bun run dev
```

---

### 8.4 Useful Backend Commands

```bash
# Run tests
.\venv\Scripts\python.exe -m pytest                    # Windows
python -m pytest                                        # Mac / Linux

# Lint & format (Ruff)
.\venv\Scripts\ruff.exe check app/                     # Windows
ruff check app/                                         # Mac / Linux

# Create a new migration after model changes
.\venv\Scripts\python.exe -m alembic revision --autogenerate -m "description"
python -m alembic revision --autogenerate -m "description"

# Roll back the last migration
.\venv\Scripts\python.exe -m alembic downgrade -1
python -m alembic downgrade -1
```

