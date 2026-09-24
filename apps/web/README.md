# nityasamagri — Web Storefront (`apps/web`)

Customer-facing storefront for the Nitya Samagri spiritual-commerce platform. Next.js 14 (App Router), wired to the `backend` Express/MongoDB API in this monorepo.

## Stack

- **Next.js 14** (App Router) + TypeScript/JSX
- **zustand** — shared client state (cart, account), persisted to `localStorage`
- **firebase** — client-side phone-OTP login
- **Razorpay Checkout** (`checkout.js`, loaded in `layout.tsx`) — online payments

## Getting started

```bash
# from the repo root (Turborepo hoists deps to the root node_modules)
npm install

cd apps/web
cp .env.local.example .env.local   # if present, else see "Environment variables" below
npm run dev                        # http://localhost:3000
```

The backend must be running separately (`cd ../../backend && npm run dev`, default `http://localhost:4000`) — this app has no built-in mock/offline mode; every page fetches real data.

## Environment variables

Set these in `apps/web/.env.local`:

| Variable | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Everything | Backend REST base, e.g. `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `/notifications` | Backend WebSocket, e.g. `ws://localhost:4000/ws` |
| `NEXT_PUBLIC_RAZORPAY_KEY` | Online checkout | Razorpay **public** key id only — never the secret |
| `NEXT_PUBLIC_FIREBASE_API_KEY` etc. (6 vars) | OTP login | From Firebase Console → Project settings → Your apps (web config) |
| `NEXT_PUBLIC_GA_ID` | Analytics | Optional |

Without Firebase/Razorpay keys, password login and COD checkout still work — only OTP login and online payment are blocked.

## App structure

```
app/
  (home)/page.jsx         Storefront — product grid, categories, festivals
  login/page.tsx          Password + Firebase OTP login, signup
  product/[slug]/page.jsx Product detail — variants, reviews, cross-sell
  cart/page.jsx           Cart → address → payment → confirm → order
  account/page.jsx        Profile, order history, sign out
  delivery/page.tsx       Order tracking (timeline + live courier)
  reviews/page.tsx        Pending reviews (delivered, unreviewed) + submitted
  notifications/page.tsx  Live order/payment events over WebSocket
  layout.tsx              Root layout, fonts, Razorpay script tag

lib/
  auth.ts        Session storage (access/refresh tokens) + apiFetch() —
                  the fetch wrapper every page uses to call the backend.
                  Auto-attaches Authorization header, auto-refreshes on 401.
  cartStore.ts    Shared cart (zustand + localStorage). Single source of
                  truth so items added on any page show up on /cart.
  accountStore.ts Profile + order history, loaded from GET /auth/me and
                  GET /orders.
  firebase.ts     Firebase client SDK init + phone-OTP helpers.
  ws.ts           Authenticated WebSocket client matching the backend's
                  post-connect `{type:"auth", token}` handshake.
```

## Backend wiring status

Every page fetches live data — nothing is hardcoded/mocked anymore. Endpoints used, by page:

| Page | Endpoints |
|---|---|
| `login` | `POST /auth/login`, `POST /auth/otp/verify`, `POST /auth/register` |
| `(home)` | `GET /products` |
| `product/[slug]` | `GET /products/:slug` |
| `cart` | `GET/POST /addresses`, `POST /orders`, `POST /payments/create-order`, `POST /payments/verify` |
| `account` | `GET /auth/me`, `GET /orders` |
| `delivery` | `GET /orders/:orderId`, `GET /integrations/shipping/track/:orderId` |
| `reviews` | `GET /reviews/pending`, `GET /reviews/mine`, `POST /reviews`, `DELETE /reviews/:id` |
| `notifications` | WebSocket (`ws.ts`) — live events only |

### Known gaps (backend limitations, not frontend bugs)

- **Loyalty tier/points** — no backend model; `account` shows neutral placeholders (`"Member"` / `0`) instead of inventing numbers.
- **Notification history** — no REST endpoint, only live WebSocket events. Nothing before the page was opened can be shown.
- **Product images/ratings** — the `Product` model has no image field and no stored aggregate rating; the UI falls back to a placeholder emoji and computes ratings from fetched reviews where possible.
- **Wishlist** — `account`'s wishlist tab is still local-only; no backend model exists for it yet.

## Scripts

```bash
npm run dev         # start dev server on :3000
npm run build        # production build
npm run start         # run a production build
npm run lint          # next lint
npm run type-check  # tsc --noEmit
```