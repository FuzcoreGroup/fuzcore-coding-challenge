# 📒 Small Business Accounting App — AI Context Document

> Use this file as context in every AI prompt session. It describes the full product spec, tech stack, data models, API conventions, and feature-by-feature build plan.

---

## 🧱 Tech Stack

| Layer      | Technology                                             |
| ---------- | ------------------------------------------------------ |
| Frontend   | React + TypeScript (Vite or CRA)                       |
| Backend    | Node.js + Express + TypeScript                         |
| Database   | PostgreSQL (running in Docker)                         |
| Auth       | JWT (access token stored in memory or httpOnly cookie) |
| Styling    | Tailwind CSS (or CSS Modules)                          |
| PDF Export | `pdf-lib` or `@react-pdf/renderer`                     |
| AI Feature | Anthropic Claude API or Gemini SDK                     |
| Payments   | Stripe (or equivalent)                                 |
| Container  | Docker + docker-compose                                |

---

## 📁 Project Structure (suggested)

```
/
├── client/                  # React + TS frontend
│   ├── src/
│   │   ├── api/             # Axios/fetch wrappers per resource
│   │   ├── components/      # Shared UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── context/         # Auth context / global state
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # Shared TypeScript interfaces
├── server/                  # Express + TS backend
│   ├── src/
│   │   ├── routes/          # Express routers per resource
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/       # Auth middleware, error handler
│   │   ├── db/              # PostgreSQL pool + migrations
│   │   └── types/           # Shared server-side types
├── docker-compose.yml
└── PROJECT_CONTEXT.md       # ← this file
```

---

## 🔐 Feature 1: Authentication

### Goal

Users can sign up, log in, and log out. All other routes/pages require authentication.

### DB Table: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### API Endpoints

| Method | Path             | Description          |
| ------ | ---------------- | -------------------- |
| POST   | /api/auth/signup | Create account       |
| POST   | /api/auth/login  | Returns JWT          |
| POST   | /api/auth/logout | Clear session/token  |
| GET    | /api/auth/me     | Returns current user |

### Notes

- Hash passwords with `bcrypt` (saltRounds = 10)
- Sign JWT with a secret from `.env`
- Protect all non-auth routes with an `authenticateToken` middleware that reads `Authorization: Bearer <token>`
- Frontend: store token in `localStorage` or memory; attach to all requests via Axios interceptor
- Redirect unauthenticated users to `/login`

---

## 👥 Feature 2: Customers

### Goal

Users can view, add, edit, and delete their customers. Each user only sees their own customers.

### DB Table: `customers`

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### API Endpoints

| Method | Path               | Description        |
| ------ | ------------------ | ------------------ |
| GET    | /api/customers     | List all customers |
| POST   | /api/customers     | Create a customer  |
| PUT    | /api/customers/:id | Update a customer  |
| DELETE | /api/customers/:id | Delete a customer  |

### Notes

- Always filter by `user_id` from JWT to scope data per user
- Validate that `name` is present on create/update
- Deleting a customer should cascade or block if they have invoices (decide and enforce)
- Frontend: table with Name, Email, Phone, Actions (Edit/Delete); modal or side drawer for create/edit form

---

## 💸 Feature 3: Transactions

### Goal

Users can view transactions (income or expense), add new ones, and filter by type or category.

### DB Tables

#### `categories`

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL
);
```

#### `transactions`

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### API Endpoints

| Method | Path                  | Description                          |
| ------ | --------------------- | ------------------------------------ |
| GET    | /api/transactions     | List all (supports ?type=&category=) |
| POST   | /api/transactions     | Create a transaction                 |
| DELETE | /api/transactions/:id | Delete a transaction                 |
| GET    | /api/categories       | List categories                      |
| POST   | /api/categories       | Create a category                    |

### Notes

- Filter query params: `?type=income`, `?type=expense`, `?category_id=<uuid>`
- Seed a handful of default categories (e.g. Salary, Sales, Rent, Utilities, Food) for new users
- Frontend: sortable table with Date, Description, Amount (green for income, red for expense), Category, Type; filter bar above table
- "Add Transaction" form: amount, type (radio/select), category (dropdown), description, date

---

## 🧾 Feature 4: Invoices

### Goal

Users can create invoices for customers with line items, and progress them through a status lifecycle: `draft → sent → paid`.

### DB Tables

#### `invoices`

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'sent', 'paid')) DEFAULT 'draft',
  issued_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `invoice_items`

```sql
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL,
  total NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
```

### API Endpoints

| Method | Path              | Description                    |
| ------ | ----------------- | ------------------------------ |
| GET    | /api/invoices     | List all invoices              |
| GET    | /api/invoices/:id | Get single invoice with items  |
| POST   | /api/invoices     | Create invoice with line items |
| PUT    | /api/invoices/:id | Update invoice/status          |
| DELETE | /api/invoices/:id | Delete a draft invoice         |

### Notes

- Auto-generate `invoice_number` (e.g. `INV-0001`, increment per user)
- Total = sum of all line item totals
- Frontend: invoice list table with Customer, Invoice #, Status badge (colour-coded), Total, Date; Detail view shows line items and has a "Update Status" action button
- Only allow deletion of `draft` invoices

---

## 📊 Stretch Goal: Dashboard

### Goal

A summary view at `/` (home) showing key financial metrics.

### Data to Show

- **Total Revenue** — sum of all `income` transactions
- **Total Expenses** — sum of all `expense` transactions
- **Net Profit** — revenue minus expenses
- **Outstanding Invoices** — sum of totals across `draft` + `sent` invoices
- **Recent Transactions** — last 5 transactions
- **Invoice Status Breakdown** — count of draft/sent/paid

### API Endpoint

```
GET /api/dashboard/summary
```

Returns all the above in a single response to minimise round trips.

---

## 🗂️ Stretch Goal: Categories Management Screen

### Goal

A dedicated UI at `/categories` for creating, editing, and deleting income/expense categories.

- CRUD table for categories
- Show count of transactions using each category
- Prevent deletion if transactions reference the category (or allow with a warning)

---

## 📄 Stretch Goal: PDF Export

### Goal

Generate a downloadable, well-formatted PDF for any invoice.

### Suggested Approach

- Backend: use `pdf-lib` or `pdfkit` to generate the PDF server-side
- Endpoint: `GET /api/invoices/:id/pdf` → returns `application/pdf`
- Frontend: "Download PDF" button on invoice detail page that fetches and triggers browser download

### PDF Content

- Business/user name at top
- Invoice number, issued date, due date
- Customer name and contact
- Line items table (description, qty, unit price, total)
- Grand total
- Notes/payment terms at bottom

---

## 🤖 Stretch Goal: AI Categorisation

### Goal

When a user types a transaction description, automatically suggest a matching category.

### Suggested Approach

- On description field `blur` or after 300ms debounce, call:
  ```
  POST /api/ai/suggest-category
  Body: { description: string, type: "income" | "expense" }
  ```
- Backend calls Anthropic Claude API (or Gemini) with a prompt like:
  ```
  You are a bookkeeping assistant. Given this transaction description and type,
  suggest the most appropriate category from this list: [categories].
  Return only the category name, nothing else.
  ```
- Show suggestion as a dismissable hint below the category dropdown
- User can accept (auto-selects) or ignore it

### Example Prompt Template (server-side)

```ts
const prompt = `
You are a bookkeeping assistant for a small business.
Transaction type: ${type}
Description: "${description}"
Available categories: ${categoryNames.join(", ")}

Respond with only the single most appropriate category name from the list above.
`;
```

---

## 💳 Stretch Goal: Payment Links (Stripe)

### Goal

Attach a Stripe payment link to a `sent` invoice so customers can pay online.

### Suggested Approach

1. When an invoice is marked as `sent`, optionally generate a Stripe Payment Link
2. Backend: `POST /api/invoices/:id/payment-link`
   - Creates a Stripe Payment Link via Stripe SDK
   - Saves the URL to `invoices.payment_link_url`
3. Frontend: show the link on the invoice detail view with a "Copy Link" button
4. Optionally set up a Stripe webhook to auto-mark invoice as `paid` when payment succeeds

### Stripe Setup

```ts
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const paymentLink = await stripe.paymentLinks.create({
  line_items: [{ price: priceId, quantity: 1 }],
  after_completion: { type: "redirect", redirect: { url: "..." } },
});
```

---

## 🔧 Environment Variables

```env
# Server
DATABASE_URL=postgresql://user:password@localhost:5432/accounting_db
JWT_SECRET=your_jwt_secret_here
PORT=3001

# AI
ANTHROPIC_API_KEY=your_key_here
# or
GEMINI_API_KEY=your_key_here

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🌐 API Conventions

- All routes prefixed with `/api`
- All protected routes require `Authorization: Bearer <token>` header
- Responses follow:
  ```json
  { "data": {...}, "error": null }
  // or
  { "data": null, "error": "message" }
  ```
- HTTP status codes: `200` success, `201` created, `400` validation, `401` unauth, `403` forbidden, `404` not found, `500` server error
- Always return `user_id`-scoped data — never leak other users' records

---

## 🖥️ Frontend Route Map

| Path            | Page                       | Auth Required |
| --------------- | -------------------------- | ------------- |
| `/login`        | Login page                 | No            |
| `/signup`       | Signup page                | No            |
| `/`             | Dashboard                  | Yes           |
| `/customers`    | Customer list              | Yes           |
| `/transactions` | Transaction list + filters | Yes           |
| `/invoices`     | Invoice list               | Yes           |
| `/invoices/:id` | Invoice detail + status    | Yes           |
| `/categories`   | Category management        | Yes           |

---

## ✅ Build Order (Recommended)

1. **Docker + DB setup** — get Postgres running, run migrations
2. **Auth** — signup/login/JWT middleware, protected routes shell
3. **Customers CRUD** — simplest resource, establishes the pattern
4. **Transactions** — add categories seed data first, then transactions
5. **Invoices** — most complex; do list first, then detail + status update
6. **Dashboard** — aggregate queries, single endpoint
7. **Stretch goals** — PDF, AI categorisation, Stripe (in any order)

---

## 💡 AI Prompting Tips for This Project

When prompting AI (Claude, Copilot, Cursor, etc.) with this context:

1. **Always paste this file** or reference it as context at the start of a session
2. Specify the exact feature: _"Using the spec above, implement Feature 2: Customers — start with the Express router and PostgreSQL queries"_
3. Ask for one layer at a time: _backend route first, then frontend component_
4. After each feature, ask the AI to: _"Check this implementation against the spec in PROJECT_CONTEXT.md and flag any gaps"_
5. For the AI categorisation feature, paste your actual categories list into the prompt so the model can suggest realistically

---

_Last updated: April 2026 | For use with the coding challenge submission_
