# nitya-samagri-devops

Infrastructure, deployment, and CI/CD for the Nitya Samagri platform —
split out of the original `Nitya_Samagri-main` monorepo (which had this
scattered across `devops/`, `docker/`, `.github/workflows/`, and `docs/`).

## ⚠️ Database: MongoDB, not PostgreSQL

The original app repo used PostgreSQL + Prisma. The actual backend runs on
**MongoDB** — every file below has been updated accordingly:

| File | What changed |
|---|---|
| `docker/docker-compose.dev.yml` | `postgres` service → `mongodb` service (mongo:7), `pgadmin` → `mongo-express`, `DATABASE_URL` → `MONGO_URI` |
| `docker/docker-compose.prod.yml` | same env/service swap, blue/green service names unaffected |
| `docker/docker-compose.staging.yml` | same env/service swap |
| `docker/mongo/init.js` | **new** — creates an app-scoped Mongo user + starter indexes (replaces the idea of a `postgres/init.sql`, which didn't exist either) |
| `docker/entrypoints/api-entrypoint.sh` | `prisma migrate deploy` wait-loop → Mongo connection wait-loop; migrations now go through an optional `npm run migrate` hook (e.g. migrate-mongo) since Mongoose has no built-in migration runner |
| `scripts/backup.sh` | `pg_dump` → `mongodump --archive --gzip` |
| `.env.example` | `POSTGRES_PASSWORD` → `MONGO_ROOT_USER` / `MONGO_ROOT_PASSWORD` |

**Update, [current snapshot]**: the note below was accurate when first
written, but no longer is — `backend/src/database/models/*.ts` now has 22
populated Mongoose schemas (~800 lines total), so the app repo's data layer
is in sync with the Mongo setup here. Leaving the original note below for
history, since it's a useful reminder that this document can drift out of
date just like the code it describes — re-check claims like this one
against the actual repo state before relying on them.

<details>
<summary>Original note (now resolved)</summary>

Not yet touched, and worth checking: `backend/src/database/models/*.ts` in
the app repo itself were all found empty in the original zip, and there was
no `prisma/schema.prisma` file either — so there's no confirmed Mongoose
schema layer to point at yet. The `MONGO_URI` env var and connection logic
here are ready, but the actual data models in the backend app repo still
need to be written (or migrated from whatever the real source of truth is).

</details>

## What moved from where

| This repo | Came from (original repo) | Status |
|---|---|---|
| `docker/docker-compose.dev.yml` | `devops/docker-compose.yml` | migrated as-is |
| `docker/docker-compose.prod.yml` | `devops/docker-compose.prod.yml` | migrated as-is |
| `docker/docker-compose.staging.yml` | — | **new** — didn't exist before |
| `nginx/nginx.conf` + `nginx/sites/*.conf` | `devops/nginx/nginx.prod.conf` (one monolithic file) | split into per-site includes |
| `nginx/sites/chatbot.conf` | — | **new** — for the chatbot service |
| `github-actions/frontend.yml` | `.github/workflows/deploy-web.yml` | renamed |
| `github-actions/backend.yml` | `.github/workflows/deploy-api.yml` | renamed |
| `github-actions/admin.yml` | `.github/workflows/deploy-admin.yml` | renamed |
| `github-actions/rollback.yml`, `maintenance.yml`, `deploy-scheduled.yml`, `pr-checks.yml` | same names | migrated as-is |
| `github-actions/chatbot.yml` | — | **new** |
| `github-actions/security.yml` | — | **new** — dependency/secret/container scanning |
| `scripts/health-check.sh` | `devops/scripts/smoke-test.sh` | renamed, added chatbot target |
| `scripts/smoke-test.sh` | `devops/scripts/smoke-test.sh` | kept under the original name with its own full logic (see note below) |
| `redis/redis.conf` | inline `command:` flags in `docker-compose.dev.yml`/`prod.yml` | **new** — centralizes Redis config into one file |
| `docker/entrypoints/api-entrypoint.sh` | `docker/entrypoint.sh` | migrated as-is (was missed in the first pass — it's the API container's `ENTRYPOINT`: wait for Postgres → migrate → start) |
| `nginx/active/*.conf`, `nginx/active/README.md` | `docker/nginx/active/*` | migrated as-is (was missed in the first pass — the blue/green "which color is live" switch files) |
| `nginx/nginx.conf`, `nginx/sites/{frontend,admin,backend}.conf` | (fixed) | now `include` `nginx/active/*-backend.conf` and `proxy_pass` to `$api_backend`/`$web_backend`/`$admin_backend`, matching the real blue/green scheme — the first pass had wrongly used static `upstream` blocks instead |
| `scripts/switch-color.sh` | inline SSH steps in `deploy-scheduled.yml` | **new extraction** — the actual blue/green cutover logic, previously left inline only |
| `scripts/deploy.sh` | inline SSH steps in `deploy-api.yml`/`deploy-web.yml`/`deploy-admin.yml` | extracted, generalized |
| `scripts/rollback.sh` | inline SSH step in `rollback.yml` | extracted |
| `scripts/backup.sh` | inline SSH step in `maintenance.yml` | extracted |
| `scripts/cleanup.sh` | — | **new** — consolidates ad-hoc `docker image prune` calls |
| `terraform/*` | — | **new** — codifies the manual EC2 setup from `docs/DEPLOYMENT_GUIDE.md`, not yet applied |
| `monitoring/*` | — | **new** — Prometheus/Grafana starting point |

**You should review anything marked "new" before relying on it in production** —
it's scaffolded to match the existing conventions but hasn't been run against
real infrastructure.

**Note on `health-check.sh` vs `smoke-test.sh`:** these two scripts now
contain the same logic (api/web/admin/chatbot checks with retries). Having
both was a deliberate choice to keep the old filename working, but it means
a future fix has to be applied in both places. If that duplication bothers
you, delete `smoke-test.sh` and replace any remaining references to it with
`health-check.sh`.

## Layout

```
nitya-samagri-devops/
├── docker/                  # compose files for dev / staging / prod
├── nginx/
│   ├── nginx.conf           # core config, includes sites/*
│   └── sites/               # one server block per domain/service
├── github-actions/          # copy these into .github/workflows/ of the
│                             # relevant repo(s), or point a monorepo's
│                             # workflows at this repo via workflow_call
├── scripts/                 # deploy.sh, rollback.sh, backup.sh,
│                             # health-check.sh, cleanup.sh
├── monitoring/               # Prometheus + Grafana
├── terraform/                # EC2 + security group provisioning
├── redis/
│   └── redis.conf           # centralized Redis config (was inline CLI flags)
└── .env.example
```

## Usage

```bash
cp .env.example .env   # fill in real values

# local/dev stack
docker compose -f docker/docker-compose.dev.yml up -d

# staging
docker compose -f docker/docker-compose.dev.yml -f docker/docker-compose.staging.yml up -d

# prod (on the deploy host)
docker compose -f docker/docker-compose.dev.yml -f docker/docker-compose.prod.yml up -d

# deploy a single service after a build
./scripts/deploy.sh api

# check everything's up
./scripts/health-check.sh all

# roll back
./scripts/rollback.sh <tag> api
```

## GitHub Actions

These workflow files assume `secrets.SERVER_HOST`, `SERVER_USER`,
`SERVER_SSH_KEY`, `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, and (for backups)
the AWS secrets are configured on the repo/org — see `docs/ACTIONS_SECRETS.md`
in the original app repo for the full list.

If you keep this as a separate repo from the app code, you'll need to either:
- copy these files into each app repo's own `.github/workflows/`, or
- use `workflow_call` from each app repo to call into this one.

Note `chatbot.yml`'s `paths:`/checkout assumptions — they're written assuming
a monorepo layout and will need adjusting if `nitya-samagri-chatbot` stays a
separate repo.