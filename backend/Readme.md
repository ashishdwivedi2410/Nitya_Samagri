# nityasamagri backend

REST + WebSocket API for the Nitya Samagri platform (puja samagri e-commerce
+ pandit booking). Express + TypeScript, MongoDB via Mongoose, Redis for
caching/rate-limiting.

> **⚠️ Not yet runnable end-to-end.** The config/database/models layer
> below is fully converted and real. The route files
> (`src/modules/*/**.routes.ts`, `src/integrations/integrations.routes.ts`,
> `src/shared.ts`) still call `prisma.*` from the original Postgres/Prisma
> version of this app and have not been converted to the Mongoose models
> yet. The app will not build/run until that conversion is done — see
> "Known gaps" below.

## What changed from the original scaffold

This backend was originally built around PostgreSQL + Prisma, with Twilio
for OTP, SendGrid for email, and Shiprocket for shipping. It's being
migrated to:

| Was | Now |
|---|---|
| PostgreSQL + Prisma | MongoDB + Mongoose (`src/database/models/*.ts`, no `prisma/schema.prisma`) |
| Twilio (OTP/login SMS) | Firebase Auth — client verifies phone OTP, backend verifies the ID token (`src/config/firebase.ts`'s `verifyOtpToken()`). **Required in all environments**, not optional. |
| SendGrid (email) | Nodemailer over Gmail/Google Workspace SMTP (`src/integrations/mail.ts`) |
| Shiprocket (shipping) | Eshopbox (`src/integrations/eshopbox.service.ts`) — Eshopbox is a managed 3PL/WMS, not a rate aggregator, so a few Shiprocket-only methods (courier selection, AWB assignment, pickup scheduling) throw "not applicable" rather than being faked |
| Twilio for order-status SMS | **Unchanged for now** — `src/integrations/twilio.ts` still exists and is still in `package.json`; only the OTP/login flow moved to Firebase. Confirm this is still what you want when the route conversion reaches `notifications.service.ts`. |

See [`../nitya-samagri-devops/README.md`](../nitya-samagri-devops/README.md)
for the infra side of the Mongo switch (Docker, nginx, etc).

## Stack

- Express 4 + TypeScript
- MongoDB (Mongoose 8) — see `src/database/models/`
- Redis (ioredis) — caching (`src/cache/`) + rate limiting
- JWT auth (access + refresh tokens) + Google OAuth; phone OTP via Firebase
- Razorpay (payments), Eshopbox (shipping/fulfillment), Gmail SMTP (email),
  WhatsApp Business API, Firebase Admin (OTP verification, and available
  for push notifications — push itself isn't called from anywhere yet)
- WebSocket server for real-time order updates (`src/websocket/`)
- Jest + Supertest for tests

## Getting started

```bash
cp .env.example .env   # fill in real values — MONGO_URI, JWT secrets,
                        # FIREBASE_*, GMAIL_*, ESHOPBOX_*, etc.
npm install
npm run dev             # http://localhost:4000 — will fail to build until
                         # the route files are converted, see warning above
```

Requires a running MongoDB + Redis — either point `.env` at your own, or
run them via the devops repo:

```bash
docker compose -f ../nitya-samagri-devops/docker/docker-compose.dev.yml up -d mongodb redis
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with hot-reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run seed` | Seed a demo admin user, category, and product (`src/database/seed.ts`) |
| `npm run migrate` | Runs `scripts/migrate.ts` if present — **that file doesn't exist yet**; add one (e.g. via `migrate-mongo`) if you need real migrations |
| `npm test` | Run the Jest suite |
| `npm run lint` | ESLint |

## Structure

```
src/
├── app.ts, server.ts               # Express app, HTTP+WS server
├── shared.ts                       # ⚠️ dead reference file — not imported anywhere,
│                                    #    kept only as a snippet reference; ignore it
├── cache/                          # Redis key naming + get/set-JSON helpers        ✅
├── config/                         # env, database (Mongo), redis, firebase        ✅
├── database/
│   ├── models/                     # 23 real Mongoose schemas                      ✅
│   ├── indexes.ts                  # explicit index sync                           ✅
│   └── seed.ts                     # dev seed data                                 ✅
├── integrations/
│   ├── eshopbox.service.ts         # ✅ new
│   ├── mail.ts                     # ✅ new
│   ├── razorpay.service.ts         # not yet reviewed for the Mongo switch
│   ├── twilio.ts                   # still used — order-status SMS only now
│   ├── notifications.service.ts    # ⚠️ still calls prisma — pending conversion
│   ├── sendgrid.ts                 # ⚠️ stale, superseded by mail.ts — delete once
│   │                                #    nothing imports it anymore
│   ├── shiprocket.service.ts       # ⚠️ stale, superseded by eshopbox.service.ts —
│   │                                #    delete once nothing imports it anymore
│   └── integrations.routes.ts      # ⚠️ still calls prisma — pending conversion
├── middlewares/                    # auth, RBAC, validation, error handling        ✅ (untouched, already real)
├── modules/
│   ├── auth/auth.routes.ts         # ⚠️ still calls prisma — pending conversion
│   ├── products/product.routes.ts  # ⚠️ still calls prisma — pending conversion
│   ├── orders/order.routes.ts      # ⚠️ still calls prisma — pending conversion
│   └── payments/payment.routes.ts  # ⚠️ still calls prisma — pending conversion
├── utils/                          # AppError, logger, paginate                    ✅ (untouched, already real)
└── websocket/                      # real-time order status pushes                 ✅ (untouched, already real)
```

## Known gaps

1. **Route conversion is the big one.** `auth.routes.ts`, `product.routes.ts`,
   `order.routes.ts`, `payment.routes.ts`, `integrations.routes.ts`
   (~2,200 lines total) still import Prisma and need converting to use the
   Mongoose models in `src/database/models/`. Nothing will actually run
   until this is done.
2. `sendgrid.ts` and `shiprocket.service.ts` are dead weight until the
   route files above stop importing them — delete both once that's done.
3. `npm run migrate` has no real script behind it yet (see Scripts table).
4. `AWS_*` env vars are read in `.env.example` but no S3 upload code was
   found in the route files — confirm where media uploads actually happen.
5. `eshopbox.service.ts`'s tracking/webhook field names are best-effort —
   confirmed against Eshopbox's public docs only for order creation and
   auth; verify the rest against a real payload from your workspace.