# nityasamagri admin panel

Staff-facing dashboard for the Nitya Samagri platform — orders, users,
coupons, and storefront CMS content. Next.js 16 (App Router), talks to the
`backend` API over REST.

## Stack

- Next.js 16 + React 18, TypeScript
- Tailwind CSS (dark "obsidian + saffron" theme, see `tailwind.config.ts`)
- SWR for data fetching/caching
- Zustand, Zod (installed; not yet used by any of the four current pages)
- No component library — everything is hand-rolled inline styles/Tailwind

## Getting started

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL — see note below
npm install
npm run dev                  # http://localhost:3001
```

Needs the `backend` API running and reachable at `NEXT_PUBLIC_API_URL`
(defaults to `http://localhost:4000` if unset). From the repo root:

```bash
docker compose -f devops/docker/docker-compose.dev.yml up -d api mongodb redis
```

`.env.example` only lists `NEXT_PUBLIC_API_URL`, but `next.config.ts` also
reads `NEXT_PUBLIC_WS_URL` and `NEXT_PUBLIC_APP_URL` (both have working
defaults, so they're optional for local dev — set them explicitly for a
deployed environment).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with hot-reload on port **3001** |
| `npm run build` | Production build (`output: "standalone"`) |
| `npm start` | Run the production build, also on port 3001 |
| `npm run lint` | `next lint` |
| `npm run type-check` | `tsc --noEmit` |

Port 3001 is a local-dev convenience so `web` (3000) and `admin` can run
side by side. In Docker/production both listen on 3000 inside the
container — see `Dockerfile` / `devops/docker/docker-compose.*.yml`, where
Nginx (`devops/nginx/sites/admin.conf`) is what actually separates them by
domain.

## Structure

```
app/
├── layout.tsx              # Root layout — Inter + Playfair fonts, noindex metadata
├── globals.css              # Tailwind + CSS-variable theme tokens
├── login/page.tsx           # Staff login (@adminns.in email + password)
├── dashboard/page.tsx       # Stats, recent orders, order status board, user list
├── coupons/page.tsx         # Coupon CRUD
├── store/page.tsx           # CMS: homepage sections, banners, festivals, blog, SEO pages, announcements
├── _components/
│   └── RequireAuth.tsx      # Client-side auth guard, wraps each page below login
└── _lib/
    ├── adminAuth.ts         # Session storage (localStorage) + login/logout
    └── api.ts               # Fetch wrapper — attaches bearer token, auto-refreshes on 401
```

## Auth model

Staff log in with an `@adminns.in` email + password — **not** the phone-OTP
flow customers use on `apps/web`. `adminAuth.ts` posts to
`POST /api/v1/auth/login`; the backend itself rejects anyone without an
admin/staff role, so the frontend's `@adminns.in` check is a UX nicety, not
the real gate.

The session (access token, refresh token, user) lives in
`localStorage` under `nitya_admin_session` — there's no httpOnly cookie.
`RequireAuth` only checks that an access token is *present* client-side
before rendering a page; it doesn't verify it's still valid, so an expired
token briefly renders the page before the first API call 401s and
`api.ts`'s auto-refresh logic either silently renews it or clears the
session and bounces to `/login`.

One thing worth fixing separately: `RequireAuth.tsx`'s own comment still
says the auth flow is "mock/local-only for now" — that's stale.
`adminAuth.ts` has been a real, working login against the API for a while;
the comment just never got updated.

## Pages, and what they call

| Page | Backend endpoints it uses |
|---|---|
| `/login` | `POST /api/v1/auth/login` |
| `/dashboard` | `GET /api/v1/orders/admin/stats`, `GET /api/v1/orders/admin/all`, `GET /api/v1/auth/admin/users` |
| `/coupons` | `GET/POST/PATCH/DELETE /api/v1/coupons` |
| `/store` | `GET/POST/PATCH/DELETE /api/v1/cms/{sections,banners,festivals,blogs,seo-pages,announcements}` |

`coupons/page.tsx` adapts the real Mongo coupon document shape (`_id`,
`minOrderValue`, no `desc`/`applicableTo`/`category`/`festivalTag` fields)
into the shape the UI was originally built around, via a small
`adaptCoupon()` function at the top of the file — worth knowing about if a
coupon field ever looks like it's silently not saving.

## Known gaps

1. **No shared package between `apps/web` and `apps/admin`.** `_lib/api.ts`
   and the general fetch-wrapper pattern are duplicated between the two
   apps rather than pulled from a shared workspace package — expected in a
   Turborepo, but worth knowing if you're about to fix a bug in one and
   assume it'll also fix the other.
2. **No tests.** There's no `*.test.tsx`/`*.spec.tsx` anywhere in this app,
   and no test runner configured in `package.json`.
3. **`tsconfig.json`'s path aliases mostly point nowhere.** `@components/*`,
   `@lib/*`, `@hooks/*`, `@types/*` all resolve under `./src/*`, but this
   app has no `src/` directory — everything lives under `app/`. Only `@/*`
   (which also includes `./app/*`) is actually usable today.
4. **CSP allows `'unsafe-inline'` and `'unsafe-eval'` in `script-src`**
   (`next.config.ts`) — normal for an app using inline styles this
   extensively, but worth tightening if this panel is ever internet-facing
   beyond staff.
5. No `public/` directory exists yet — the Dockerfile creates an empty one
   at build time so the production image doesn't fail on a missing COPY
   source (see the comment in `Dockerfile`).