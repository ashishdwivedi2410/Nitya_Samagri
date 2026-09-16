# Actions_Secrets.md

# GitHub Actions Secrets

Go to:

**Repository → Settings → Security → Secrets and variables → Actions**

Add the following **Repository Secrets**.

| Secret Name | Description |
|-------------|-------------|
| APP_ENV | Application environment (production/development) |
| APP_KEY | Application secret key |
| APP_URL | Application URL |
| DB_HOST | Database host |
| DB_PORT | Database port |
| DB_DATABASE | Database name |
| DB_USERNAME | Database username |
| DB_PASSWORD | Database password |
| JWT_SECRET | JWT signing secret |
| SESSION_SECRET | Session secret |
| API_BASE_URL | Backend API URL |
| NEXT_PUBLIC_API_URL | Frontend API URL (if using Next.js) |
| REDIS_HOST | Redis host |
| REDIS_PORT | Redis port |
| REDIS_PASSWORD | Redis password |
| AWS_ACCESS_KEY_ID | AWS access key |
| AWS_SECRET_ACCESS_KEY | AWS secret key |
| AWS_REGION | AWS region |
| AWS_BUCKET | S3 bucket name |
| SMTP_HOST | SMTP server |
| SMTP_PORT | SMTP port |
| SMTP_USERNAME | SMTP username |
| SMTP_PASSWORD | SMTP password |
| SMTP_FROM_EMAIL | Sender email |
| RAZORPAY_KEY_ID | Razorpay public key |
| RAZORPAY_KEY_SECRET | Razorpay secret key |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Cloudinary API key |
| CLOUDINARY_API_SECRET | Cloudinary API secret |
| GOOGLE_CLIENT_ID | Google OAuth Client ID |
| GOOGLE_CLIENT_SECRET | Google OAuth Client Secret |
| FIREBASE_PROJECT_ID | Firebase project ID |
| FIREBASE_CLIENT_EMAIL | Firebase service account email |
| FIREBASE_PRIVATE_KEY | Firebase private key |
| SENTRY_AUTH_TOKEN | Sentry authentication token |
| SENTRY_DSN | Sentry DSN |
| GITHUB_TOKEN | Automatically provided by GitHub (do not create manually) |

---

# GitHub Actions Variables (Optional)

Repository → Settings → Secrets and variables → **Variables**

| Variable | Description |
|----------|-------------|
| NODE_VERSION | Node.js version (e.g. 22) |
| PNPM_VERSION | pnpm version |
| DEPLOY_ENV | production / staging |
| APP_NAME | Nitya Samagri |
| REGION | Deployment region |
| DOCKER_IMAGE | Docker image name |
| DOCKER_REGISTRY | Docker registry URL |

---

# Notes

- Never commit secrets into the repository.
- Use Repository Secrets for sensitive values.
- Use Variables for non-sensitive configuration.
- Rotate secrets periodically.
- Limit access to repository administrators.
```