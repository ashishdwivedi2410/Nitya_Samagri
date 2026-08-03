# 🚀 nityasamagri — AWS Lightsail Deployment Guide

> **Server:** AWS Lightsail · **OS:** Ubuntu 22.04 LTS
> **Domain:** nityasamagri.com
> **Stack:** Docker + Nginx + SSL (Let's Encrypt)

---

## 📋 What We'll Deploy

| Service | URL |
|---------|-----|
| Customer Storefront | https://nityasamagri.com |
| Admin Panel | https://admin.nityasamagri.com |
| Pandit Panel | https://pandit.nityasamagri.com |
| REST API | https://api.nityasamagri.com |
| WebSocket | wss://api.nityasamagri.com/ws |

---

## STEP 1 — Create AWS Lightsail Instance

### 1.1 Login to AWS Lightsail
```
https://lightsail.aws.amazon.com
```

### 1.2 Create Instance
- Click **"Create instance"**
- **Platform:** Linux/Unix
- **Blueprint:** Ubuntu 22.04 LTS
- **Instance plan:** Choose **4 GB RAM / 2 vCPUs / 80 GB SSD** (minimum recommended)
  - $20/month plan works for production
  - You can upgrade later without data loss
- **Instance name:** `nityasamagri-prod`
- Click **"Create instance"**

### 1.3 Create Static IP
```
Lightsail → Networking → Create static IP
→ Attach to: nityasamagri-prod
→ Name: nityasamagri-static-ip
```
> ⚠️ Static IP is FREE when attached to an instance. Required so your IP doesn't change.

### 1.4 Open Firewall Ports
```
Lightsail → nityasamagri-prod → Networking → Firewall
→ Add rule: TCP port 80   (HTTP)
→ Add rule: TCP port 443  (HTTPS)
→ Add rule: TCP port 22   (SSH — already open)
```

### 1.5 Download SSH Key
```
Lightsail → Account → SSH keys → Download default key
→ Save as: nityasamagri-key.pem
```

---

## STEP 2 — Connect to Server

```bash
# On your local machine
chmod 400 nityasamagri-key.pem

ssh -i nityasamagri-key.pem ubuntu@YOUR_STATIC_IP
```

---

## STEP 3 — Point Domain to Lightsail

### 3.1 In your domain registrar (GoDaddy / Namecheap / etc.)

Add these DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_STATIC_IP | 300 |
| A | www | YOUR_STATIC_IP | 300 |
| A | admin | YOUR_STATIC_IP | 300 |
| A | pandit | YOUR_STATIC_IP | 300 |
| A | api | YOUR_STATIC_IP | 300 |

> ⏳ DNS propagation takes 5–30 minutes. Check with:
> ```bash
> nslookup nityasamagri.com
> ```

---

## STEP 4 — Server Setup

### 4.1 Update system
```bash
sudo apt update && sudo apt upgrade -y
```

### 4.2 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu
newgrp docker

# Verify
docker --version
```

### 4.3 Install Docker Compose
```bash
sudo apt install -y docker-compose-plugin

# Verify
docker compose version
```

### 4.4 Install Certbot (SSL)
```bash
sudo apt install -y certbot

# Verify
certbot --version
```

### 4.5 Install Git + other tools
```bash
sudo apt install -y git curl wget nano htop
```

---

## STEP 5 — Get SSL Certificate

> ⚠️ DNS must be propagated before this step. Verify first:
> ```bash
> ping nityasamagri.com   # should show your Lightsail IP
> ```

```bash
# Stop any service on port 80 first (nothing running yet, so skip)
# Get SSL for all subdomains at once

sudo certbot certonly --standalone \
  -d nityasamagri.com \
  -d www.nityasamagri.com \
  -d admin.nityasamagri.com \
  -d pandit.nityasamagri.com \
  -d api.nityasamagri.com \
  --email admin@nityasamagri.com \
  --agree-tos \
  --non-interactive
```

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/nityasamagri.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/nityasamagri.com/privkey.pem
This certificate expires on 2026-09-01.
```

### 5.1 Auto-renew SSL (add to crontab)
```bash
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet && docker compose -f /home/ubuntu/nityasamagri/docker-compose.yml -f /home/ubuntu/nityasamagri/docker-compose.prod.yml restart nginx
```

---

## STEP 6 — Clone Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/nityasamagri.git
cd nityasamagri
```

---

## STEP 7 — Configure Environment Variables

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Fill in ALL values:

```env
# App
NODE_ENV=production
PORT=4000
ALLOWED_ORIGINS=https://nityasamagri.com,https://admin.nityasamagri.com,https://pandit.nityasamagri.com

# Database
DATABASE_URL=postgresql://postgres:YOUR_STRONG_PASSWORD@postgres:5432/nityasamagri

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_generated_jwt_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_generated_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=30d

# Razorpay
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX

# Twilio
TWILIO_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_TOKEN=your_auth_token
TWILIO_PHONE=+91XXXXXXXXXX

# SendGrid
SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXX
SENDGRID_FROM_EMAIL=noreply@nityasamagri.com

# AWS S3
AWS_ACCESS_KEY_ID=XXXXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_REGION=ap-south-1
AWS_S3_BUCKET=nityasamagri-media

# WhatsApp
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_ID=your_phone_number_id

# Shiprocket
SHIPROCKET_EMAIL=your@email.com
SHIPROCKET_PASSWORD=your_password
PICKUP_PINCODE=160055
```

> Press `Ctrl+X` → `Y` → `Enter` to save in nano

### 7.1 Create docker .env file (for Docker Compose)
```bash
cat > .env << 'EOF'
POSTGRES_PASSWORD=YOUR_STRONG_DB_PASSWORD
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXX
EOF
```

---

## STEP 8 — Build & Start All Services

```bash
# Build and start everything in production mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Watch logs during startup
docker compose logs -f
```

**Expected services running:**
```
nityasamagri_postgres  — Up (healthy)
nityasamagri_redis     — Up (healthy)
nityasamagri_api       — Up (healthy)
nityasamagri_web       — Up
nityasamagri_admin     — Up
nityasamagri_pandit    — Up
nityasamagri_nginx     — Up
```

### Check all containers:
```bash
docker compose ps
```

---

## STEP 9 — Run Database Migrations & Seed

```bash
# Run migrations
docker compose exec api npx prisma migrate deploy

# Seed sample data (first time only)
docker compose exec api npx ts-node prisma/seed.ts

# Verify DB is working
docker compose exec api npx prisma studio
# Opens at http://YOUR_IP:5555 (only for testing, close after use)
```

---

## STEP 10 — Verify Everything is Live

### 10.1 Check API health
```bash
curl https://api.nityasamagri.com/health
# Expected: {"status":"ok","timestamp":"...","version":"1.0.0"}
```

### 10.2 Check all URLs
```bash
curl -I https://nityasamagri.com
curl -I https://admin.nityasamagri.com
curl -I https://pandit.nityasamagri.com
curl -I https://api.nityasamagri.com/health
```

All should return `HTTP/2 200`

### 10.3 Open in browser
- https://nityasamagri.com → Customer storefront
- https://admin.nityasamagri.com → Admin panel
- https://pandit.nityasamagri.com → Pandit panel

---

## STEP 11 — Setup Razorpay Webhook

```
1. Login to Razorpay Dashboard
2. Settings → Webhooks → Add New Webhook
3. URL: https://api.nityasamagri.com/api/v1/payments/webhook
4. Secret: (same as RAZORPAY_WEBHOOK_SECRET in .env)
5. Events to select:
   ✅ payment.captured
   ✅ payment.failed
   ✅ refund.processed
6. Click Save
```

---

## STEP 12 — Setup Shiprocket Webhook

```
1. Login to Shiprocket
2. Settings → API → Webhooks
3. Add Webhook URL: https://api.nityasamagri.com/api/v1/integrations/shipping/webhook
4. Select all shipment events
5. Save
```

---

## STEP 13 — Setup GitHub Actions (Auto-deploy)

### 13.1 Add secrets to GitHub
```
GitHub → Your Repo → Settings → Secrets → Actions → New secret
```

Add all secrets from `.github/SECRETS.md`:
- `SERVER_HOST` = your Lightsail static IP
- `SERVER_USER` = ubuntu
- `SERVER_SSH_KEY` = contents of nityasamagri-key.pem
- All Razorpay, Twilio, AWS secrets...

### 13.2 From now on — deploy with git push
```bash
# On your local machine
git add .
git commit -m "feat: your changes"
git push origin main

# GitHub Actions automatically:
# 1. Runs tests
# 2. Builds Docker image
# 3. Pushes to Docker Hub
# 4. SSH into Lightsail
# 5. Pulls new image
# 6. Runs migrations
# 7. Restarts containers
```

---

## 🔧 Useful Commands

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f nginx
docker compose logs -f web
```

### Restart a service
```bash
docker compose restart api
docker compose restart nginx
```

### Update code manually
```bash
cd ~/nityasamagri
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build api
docker compose exec api npx prisma migrate deploy
```

### Check disk space
```bash
df -h
docker system df
```

### Clean up old Docker images
```bash
docker image prune -f
docker system prune -f
```

### Monitor server resources
```bash
htop          # CPU + RAM usage
docker stats  # Per-container resource usage
```

### Backup database manually
```bash
docker compose exec postgres pg_dump -U postgres nityasamagri | gzip > backup_$(date +%Y%m%d).sql.gz
```

### View Nginx logs
```bash
docker compose exec nginx tail -f /var/log/nginx/access.log
docker compose exec nginx tail -f /var/log/nginx/error.log
```

---

## 🔒 Security Checklist

```
✅ SSL certificate installed (Let's Encrypt)
✅ Firewall: only ports 22, 80, 443 open
✅ Strong passwords for PostgreSQL and Redis
✅ JWT secrets are 32+ random characters
✅ .env file is in .gitignore (never committed)
✅ Admin panel restricted (add IP whitelist in nginx.prod.conf)
✅ Razorpay webhook signature verification enabled
✅ Rate limiting active on API
✅ CORS restricted to your domains only
```

### Optional: Restrict admin panel to office IP
```bash
nano ~/nityasamagri/docker/nginx/nginx.prod.conf

# Find the admin server block and uncomment:
# allow YOUR_OFFICE_IP;
# deny all;

docker compose restart nginx
```

---

## 📊 Monitor Your Deployment

### AWS Lightsail Monitoring
```
Lightsail → nityasamagri-prod → Metrics
→ CPU utilization
→ Network in/out
→ Status check
```

### Set up alerts
```
Lightsail → nityasamagri-prod → Alarms
→ Add alarm: CPU > 80% → notify via email
→ Add alarm: Instance status check failed → notify
```

---

## 🆙 Scaling (When You Grow)

### Upgrade Lightsail plan
```
Lightsail → nityasamagri-prod → Upgrade plan
→ No data loss
→ 5 minute downtime
```

### Add more replicas (in docker-compose.prod.yml)
```yaml
api:
  deploy:
    replicas: 3   # Change from 2 to 3
```

### Add a second server
```
Lightsail → Create instance (nityasamagri-prod-2)
→ Same setup
→ Add load balancer in Lightsail
```

---

## ✅ Final Checklist Before Going Live

```
□ All containers running (docker compose ps)
□ API health check passing (curl https://api.nityasamagri.com/health)
□ Customer web loading (https://nityasamagri.com)
□ Admin panel loading (https://admin.nityasamagri.com)
□ Pandit panel loading (https://pandit.nityasamagri.com)
□ SSL certificate valid (green padlock in browser)
□ Razorpay test payment working
□ OTP SMS sending (test with your own number)
□ Database seeded with sample data
□ Backup cron job active
□ GitHub Actions secrets configured
□ Domain DNS all pointing correctly
□ Monitoring alerts set up in Lightsail
```

---

## 🆘 Troubleshooting

### Container won't start
```bash
docker compose logs api --tail=50
# Look for error messages
```

### Database connection failed
```bash
# Check postgres is healthy
docker compose ps postgres

# Test connection
docker compose exec api npx prisma db push
```

### SSL certificate error
```bash
# Renew manually
sudo certbot renew --force-renewal
docker compose restart nginx
```

### API returning 502
```bash
# Check if API container is running
docker compose ps api

# Restart API
docker compose restart api
docker compose logs api --tail=20
```

### Out of disk space
```bash
docker system prune -af  # Remove unused images/containers
```

---

*🪔 nityasamagri — Deployed on AWS Lightsail · Mohali, Punjab*
*Support: support@nityasamagri.com*
