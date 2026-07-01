# ─────────────────────────────────────────────────────────────────────────────
# GitHub Actions — Required Secrets
# Add all these in: GitHub Repo → Settings → Secrets → Actions
# ─────────────────────────────────────────────────────────────────────────────

## How to add secrets
## 1. Go to your GitHub repository
## 2. Click Settings → Secrets and variables → Actions
## 3. Click "New repository secret"
## 4. Add each secret below

## ── DOCKER HUB ───────────────────────────────────────────────────────────────
## DOCKERHUB_USERNAME   Your Docker Hub username
## DOCKERHUB_TOKEN      Docker Hub access token (not password)
##                      → hub.docker.com → Account Settings → Security → New Access Token

## ── VERCEL ───────────────────────────────────────────────────────────────────
## VERCEL_TOKEN          Vercel personal access token
##                       → vercel.com → Settings → Tokens → Create
## VERCEL_ORG_ID         Your Vercel team/org ID
##                       → vercel.com → Settings → General → Team ID
## VERCEL_WEB_PROJECT_ID  Vercel project ID for customer web
## VERCEL_ADMIN_PROJECT_ID Vercel project ID for admin panel
## VERCEL_PANDIT_PROJECT_ID Vercel project ID for pandit panel
##                       → vercel.com → Project → Settings → General → Project ID

## ── SERVER (EC2/VPS) ─────────────────────────────────────────────────────────
## SERVER_HOST           Your server IP address e.g. 13.235.100.200
## SERVER_USER           SSH username e.g. ubuntu
## SERVER_SSH_KEY        Full private SSH key content
##                       → cat ~/.ssh/your-key.pem (copy entire content including headers)

## ── RAZORPAY ─────────────────────────────────────────────────────────────────
## RAZORPAY_KEY_ID       rzp_live_XXXXXXXXXXXXXXXX
## RAZORPAY_KEY_SECRET   Your Razorpay secret key
## RAZORPAY_WEBHOOK_SECRET  Webhook secret from Razorpay dashboard

## ── TWILIO ───────────────────────────────────────────────────────────────────
## TWILIO_SID            ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
## TWILIO_TOKEN          Your Twilio Auth Token
## TWILIO_PHONE          +1XXXXXXXXXX (your Twilio number)

## ── SENDGRID ─────────────────────────────────────────────────────────────────
## SENDGRID_API_KEY      SG.XXXXXXXXXXXXXXXXXXXXXXXX

## ── AWS ──────────────────────────────────────────────────────────────────────
## AWS_ACCESS_KEY_ID     XXXXXXXXXXXXXXXXXXXX
## AWS_SECRET_ACCESS_KEY XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
## AWS_REGION            ap-south-1
## AWS_S3_BUCKET         khatumart-media

## ── CLOUDFLARE (optional, for CDN cache purge) ───────────────────────────────
## CF_ZONE_ID            Your Cloudflare Zone ID
## CF_API_TOKEN          Cloudflare API token with Cache Purge permission

## ── DATABASE ─────────────────────────────────────────────────────────────────
## POSTGRES_PASSWORD     Production PostgreSQL password (strong random string)
## REDIS_PASSWORD        Production Redis password

## ── JWT ──────────────────────────────────────────────────────────────────────
## JWT_SECRET            Random string min 32 chars
## JWT_REFRESH_SECRET    Random string min 32 chars

## ── APP ──────────────────────────────────────────────────────────────────────
## ADMIN_API_TOKEN       JWT token for admin user (used by maintenance workflow)

## ── Generate strong random secrets ───────────────────────────────────────────
## Run this command to generate secrets:
## node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

## ─────────────────────────────────────────────────────────────────────────────
## QUICK SETUP CHECKLIST
## ─────────────────────────────────────────────────────────────────────────────
## □ DOCKERHUB_USERNAME
## □ DOCKERHUB_TOKEN
## □ VERCEL_TOKEN
## □ VERCEL_ORG_ID
## □ VERCEL_WEB_PROJECT_ID
## □ VERCEL_ADMIN_PROJECT_ID
## □ VERCEL_PANDIT_PROJECT_ID
## □ SERVER_HOST
## □ SERVER_USER
## □ SERVER_SSH_KEY
## □ RAZORPAY_KEY_ID
## □ RAZORPAY_KEY_SECRET
## □ RAZORPAY_WEBHOOK_SECRET
## □ TWILIO_SID
## □ TWILIO_TOKEN
## □ TWILIO_PHONE
## □ SENDGRID_API_KEY
## □ AWS_ACCESS_KEY_ID
## □ AWS_SECRET_ACCESS_KEY
## □ AWS_REGION
## □ AWS_S3_BUCKET
## □ POSTGRES_PASSWORD
## □ REDIS_PASSWORD
## □ JWT_SECRET
## □ JWT_REFRESH_SECRET
## □ ADMIN_API_TOKEN