# TheKhatuMart — GitHub Repository Structure & Deployment Guide

## 📁 Exact Folder Structure (copy files here)

```
khatumart/                              ← GitHub repo root
│
├── .github/
│   └── workflows/
│       ├── deploy-api.yml              ← (build next: CI/CD)
│       ├── deploy-web.yml              ← (build next: CI/CD)
│       └── deploy-admin.yml            ← (build next: CI/CD)
│
├── apps/
│   ├── web/                            ← Customer storefront (Next.js)
│   │   ├── app/
│   │   │   ├── (home)/
│   │   │   │   └── page.tsx            ← StoreFront.jsx
│   │   │   ├── product/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx        ← ProductDetail.jsx
│   │   │   ├── book-pandit/
│   │   │   │   └── page.tsx            ← PanditBooking.jsx
│   │   │   ├── cart/
│   │   │   │   └── page.tsx            ← CartCheckout.jsx
│   │   │   ├── account/
│   │   │   │   └── page.tsx            ← CustomerAccount.jsx
│   │   │   ├── delivery/
│   │   │   │   └── page.tsx            ← DeliveryScheduling.jsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx            ← AuthPages.jsx
│   │   │   └── layout.tsx
│   │   ├── public/
│   │   ├── Dockerfile                  ← nextjs.Dockerfile
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   ├── admin/                          ← Admin panel (Next.js)
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx            ← AdminDashboard.jsx
│   │   │   ├── store/
│   │   │   │   └── page.tsx            ← StoreManagement.jsx
│   │   │   └── layout.tsx
│   │   ├── Dockerfile                  ← nextjs.Dockerfile
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── pandit/                         ← Pandit panel (Next.js)
│       ├── app/
│       │   ├── dashboard/
│       │   │   └── page.tsx            ← PanditPanel.jsx
│       │   └── layout.tsx
│       ├── Dockerfile                  ← nextjs.Dockerfile
│       ├── next.config.ts
│       └── package.json
│
├── backend/                            ← Node.js REST + WebSocket API
│   ├── src/
│   │   ├── app.ts                      ← app.ts ✅
│   │   ├── shared.ts                   ← shared.ts ✅
│   │   ├── websocket/
│   │   │   └── ws.server.ts            ← ws.server.ts ✅
│   │   └── modules/
│   │       ├── auth/
│   │       │   └── auth.routes.ts      ← auth.routes.ts ✅
│   │       ├── orders/
│   │       │   └── order.routes.ts     ← order.routes.ts ✅
│   │       ├── products/
│   │       │   └── product.routes.ts   ← product.routes.ts ✅
│   │       └── payments/
│   │           └── payment.routes.ts   ← payment.routes.ts ✅
│   ├── prisma/
│   │   └── schema.prisma               ← schema.prisma ✅
│   ├── Dockerfile                      ← backend.Dockerfile ✅
│   ├── .env.example                    ← .env.example ✅
│   ├── tsconfig.json                   ← tsconfig.json ✅
│   └── package.json                    ← package.json ✅
│
├── docker/
│   └── nginx/
│       └── nginx.prod.conf             ← nginx.prod.conf ✅
│
├── docker-compose.yml                  ← docker-compose.yml ✅
├── docker-compose.prod.yml             ← docker-compose.prod.yml ✅
├── turbo.json
├── .gitignore
└── README.md
```

---

## 🚀 Step-by-Step: Push to GitHub & Go Live

### STEP 1 — Create GitHub repo

```bash
# Go to github.com → New Repository
# Name: khatumart
# Private: YES (production code)
# Do NOT add README (we'll push our own)
```

### STEP 2 — Initialize on your machine

```bash
# Create project folder
mkdir khatumart && cd khatumart

# Initialize git
git init
git branch -M main

# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/khatumart.git
```

### STEP 3 — Create the folder structure

```bash
# Create all directories
mkdir -p apps/web/app/{product/\[slug\],book-pandit,cart,account,delivery,login,\(home\)}
mkdir -p apps/admin/app/{dashboard,store}
mkdir -p apps/pandit/app/dashboard
mkdir -p backend/src/{modules/{auth,orders,products,payments},websocket}
mkdir -p backend/prisma
mkdir -p docker/nginx
mkdir -p .github/workflows
```

### STEP 4 — Copy your files (exact mapping)

```bash
# ── FRONTEND ──────────────────────────────────────────────
cp StoreFront.jsx        apps/web/app/\(home\)/page.tsx
cp ProductDetail.jsx     apps/web/app/product/\[slug\]/page.tsx
cp PanditBooking.jsx     apps/web/app/book-pandit/page.tsx
cp CartCheckout.jsx      apps/web/app/cart/page.tsx
cp CustomerAccount.jsx   apps/web/app/account/page.tsx
cp DeliveryScheduling.jsx apps/web/app/delivery/page.tsx
cp AuthPages.jsx         apps/web/app/login/page.tsx
cp AdminDashboard.jsx    apps/admin/app/dashboard/page.tsx
cp StoreManagement.jsx   apps/admin/app/store/page.tsx
cp PanditPanel.jsx       apps/pandit/app/dashboard/page.tsx

# ── BACKEND ───────────────────────────────────────────────
cp backend/src/app.ts              backend/src/app.ts
cp backend/src/shared.ts           backend/src/shared.ts
cp backend/src/websocket/ws.server.ts backend/src/websocket/ws.server.ts
cp backend/src/modules/auth/auth.routes.ts      backend/src/modules/auth/
cp backend/src/modules/orders/order.routes.ts   backend/src/modules/orders/
cp backend/src/modules/products/product.routes.ts backend/src/modules/products/
cp backend/src/modules/payments/payment.routes.ts backend/src/modules/payments/
cp backend/prisma/schema.prisma    backend/prisma/schema.prisma
cp backend/package.json            backend/package.json
cp backend/tsconfig.json           backend/tsconfig.json
cp backend/.env.example            backend/.env.example

# ── DEVOPS ────────────────────────────────────────────────
cp devops/docker-compose.yml       docker-compose.yml
cp devops/docker-compose.prod.yml  docker-compose.prod.yml
cp devops/docker/backend.Dockerfile backend/Dockerfile
cp devops/docker/nextjs.Dockerfile  apps/web/Dockerfile
cp devops/docker/nextjs.Dockerfile  apps/admin/Dockerfile
cp devops/docker/nextjs.Dockerfile  apps/pandit/Dockerfile
cp devops/nginx/nginx.prod.conf    docker/nginx/nginx.prod.conf
```

### STEP 5 — Create .gitignore

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
.next/
dist/
build/
out/

# Environment files (NEVER commit these)
.env
.env.local
.env.production
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Prisma
backend/src/generated/

# Docker volumes
postgres_data/
redis_data/
EOF
```

### STEP 6 — Create turbo.json (monorepo config)

```bash
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {}
  }
}
EOF
```

### STEP 7 — First commit & push

```bash
git add .
git commit -m "🪔 Initial commit — TheKhatuMart production platform"
git push -u origin main
```

---

## 🔐 GitHub Secrets (Settings → Secrets → Actions)

Add these in your GitHub repo settings before CI/CD works:

| Secret Name | Value |
|-------------|-------|
| `POSTGRES_PASSWORD` | your db password |
| `REDIS_PASSWORD` | your redis password |
| `JWT_SECRET` | random 32+ char string |
| `JWT_REFRESH_SECRET` | random 32+ char string |
| `RAZORPAY_KEY_ID` | rzp_live_XXXXX |
| `RAZORPAY_KEY_SECRET` | your secret |
| `RAZORPAY_WEBHOOK_SECRET` | your webhook secret |
| `TWILIO_SID` | your Twilio SID |
| `TWILIO_TOKEN` | your Twilio token |
| `TWILIO_PHONE` | +91XXXXXXXXXX |
| `SENDGRID_API_KEY` | SG.XXXXX |
| `AWS_ACCESS_KEY_ID` | your AWS key |
| `AWS_SECRET_ACCESS_KEY` | your AWS secret |
| `AWS_S3_BUCKET` | khatumart-media |
| `SERVER_HOST` | your server IP |
| `SERVER_USER` | ubuntu |
| `SERVER_SSH_KEY` | your private SSH key |

---

## 🌐 Local Development (after cloning)

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/khatumart.git
cd khatumart

# Copy env files
cp backend/.env.example backend/.env
# Fill in your values in backend/.env

# Start everything with Docker
docker compose up -d

# Run DB migrations
docker compose exec api npx prisma migrate dev

# Seed sample data
docker compose exec api npm run seed

# Access
# Customer:  http://localhost:3000
# Admin:     http://localhost:3001
# Pandit:    http://localhost:3002
# API:       http://localhost:4000
# pgAdmin:   http://localhost:5050
# MinIO:     http://localhost:9001
```

---

## 📦 Production Deployment (AWS EC2 / VPS)

```bash
# On your server — first time setup
sudo apt update && sudo apt install -y docker.io docker-compose-plugin certbot

# Clone repo on server
git clone https://github.com/YOUR_USERNAME/khatumart.git
cd khatumart

# Create production env
cp backend/.env.example backend/.env
nano backend/.env   # fill all values

# Get SSL certificate
sudo certbot certonly --standalone -d thekhatumart.com \
  -d www.thekhatumart.com \
  -d admin.thekhatumart.com \
  -d pandit.thekhatumart.com \
  -d api.thekhatumart.com

# Start production stack
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations
docker compose exec api npx prisma migrate deploy

# Check everything is running
docker compose ps
```

---

## 📊 File Count Summary

| Category | Files | Status |
|----------|-------|--------|
| Customer Storefront | 7 pages | ✅ Ready |
| Admin Dashboard | 2 pages | ✅ Ready |
| Pandit Panel | 1 page | ✅ Ready |
| Backend API | 7 TypeScript files | ✅ Ready |
| Database Schema | 1 Prisma schema | ✅ Ready |
| DevOps / Docker | 5 config files | ✅ Ready |
| **Total** | **26 files** | ✅ |
