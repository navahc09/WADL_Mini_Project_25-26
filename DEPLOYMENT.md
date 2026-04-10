# TNP Platform — AWS Deployment Guide

> Region: **ap-south-1** (Mumbai) | No custom domain | SES for email

---

## Files created in this repo for deployment

| File | Purpose |
|---|---|
| `backend/.env.example` | Template for EC2 production environment |
| `backend/ecosystem.config.js` | PM2 process config |
| `frontend/.env.example` | Template for frontend build env |
| `nginx/tnp.conf` | Nginx reverse proxy config |
| `scripts/ec2-setup.sh` | One-time EC2 bootstrap script |
| `scripts/deploy-frontend.sh` | Local build + S3 upload script |
| `scripts/s3-frontend-bucket-policy.json` | S3 public read policy (frontend bucket) |
| `scripts/s3-documents-cors.json` | CORS policy (docs/resume S3 bucket) |
| `.github/workflows/deploy.yml` | GitHub Actions CI/CD pipeline |

---

## Step 1 — RDS PostgreSQL

1. Open **AWS Console → RDS → Create database**
2. Engine: PostgreSQL 16, Template: **Free tier**
3. DB identifier: `tnp-postgres`, Username: `postgres`, set a strong password
4. Instance: `db.t3.micro`, Storage: 20 GiB, Public access: **Yes** (temp)
5. Create a new Security Group: `tnp-db-sg`
6. ✅ Note the **Endpoint** URL

---

## Step 2 — EC2 Instance

1. **EC2 → Launch Instance**
   - AMI: **Amazon Linux 2023**
   - Type: `t2.micro` (free tier)
   - Key pair: create `tnp-key` → download `.pem`
   - Security group `tnp-ec2-sg`:
     - Port 22 → **Your IP only**
     - Port 80 → 0.0.0.0/0
     - Port 443 → 0.0.0.0/0
2. After launch: **EC2 → Elastic IPs → Allocate → Associate** to your instance
3. Add EC2's security group (`tnp-ec2-sg`) as inbound rule on `tnp-db-sg` (port 5432)

---

## Step 3 — EC2 Setup & Backend Deploy

```bash
# SSH in
ssh -i tnp-key.pem ec2-user@<ELASTIC_IP>

# Run the setup script (copy contents of scripts/ec2-setup.sh and run)
# OR:
curl -o setup.sh https://raw.githubusercontent.com/<your-org>/tnp-platform/main/scripts/ec2-setup.sh
chmod +x setup.sh && ./setup.sh

# Clone repo
git clone https://github.com/<your-org>/tnp-platform.git /home/ec2-user/tnp

# Create .env from template
cp /home/ec2-user/tnp/backend/.env.example /home/ec2-user/tnp/backend/.env
nano /home/ec2-user/tnp/backend/.env
# Fill in: DATABASE_URL, JWT_SECRET, AWS creds, SES_FROM_EMAIL, FRONTEND_URL

# Generate JWT_SECRET:
openssl rand -base64 64

# Copy Nginx config
sudo cp /home/ec2-user/tnp/nginx/tnp.conf /etc/nginx/conf.d/tnp.conf
sudo nginx -t && sudo systemctl reload nginx

# Install dependencies
cd /home/ec2-user/tnp/backend
npm install --omit=dev

# Run migrations
npm run migrate

# Start backend
pm2 start ecosystem.config.js
pm2 startup    # ← copy and run the output command
pm2 save

# Test
curl http://localhost:5000/health
curl http://<ELASTIC_IP>/health
```

---

## Step 4 — Frontend: S3 Bucket

1. **S3 → Create bucket**
   - Name: `tnp-frontend-prod` (must be globally unique)
   - Region: `ap-south-1`
   - Uncheck "Block all public access"
2. **Properties → Static website hosting → Enable**
   - Index document: `index.html`
   - Error document: `index.html`
3. **Permissions → Bucket policy** → paste `scripts/s3-frontend-bucket-policy.json`  
   (replace `CHANGE_ME_FRONTEND_BUCKET_NAME`)

---

## Step 5 — Frontend: CloudFront

1. **CloudFront → Create distribution**
   - Origin domain: select the S3 bucket **website endpoint** (not the S3 REST endpoint)
   - Viewer protocol: **Redirect HTTP to HTTPS**
   - Default root object: `index.html`
2. **Error pages** → Add:
   - 403 → `/index.html` → HTTP 200
   - 404 → `/index.html` → HTTP 200
3. ✅ Note the **Distribution domain** (e.g., `d1abc.cloudfront.net`)
4. **Update backend** `.env` on EC2:
   ```
   FRONTEND_URL=https://d1abc.cloudfront.net
   ```
   Then: `pm2 reload tnp-backend`

---

## Step 6 — Build & Upload Frontend

Edit `scripts/deploy-frontend.sh`:
```bash
EC2_ELASTIC_IP="13.232.xx.xx"      # your EC2 elastic IP
S3_BUCKET="tnp-frontend-prod"      # bucket name from Step 4
CF_DISTRIBUTION_ID="EXXXXXX"       # from CloudFront Step 5
```

Then on your local machine (Windows — run in Git Bash):
```bash
chmod +x scripts/deploy-frontend.sh
./scripts/deploy-frontend.sh
```

---

## Step 7 — Update Document S3 Bucket CORS

1. Open your existing S3 bucket (student documents/resumes)
2. **Permissions → CORS** → paste `scripts/s3-documents-cors.json`
3. Replace `CHANGE_ME` with your CloudFront domain

---

## Step 8 — GitHub Actions CI/CD

Add these **repository secrets** (Settings → Secrets → Actions):

| Secret | Value |
|---|---|
| `EC2_HOST` | Your EC2 Elastic IP |
| `EC2_SSH_KEY` | Contents of `tnp-key.pem` (the full private key) |
| `VITE_API_BASE_URL` | `http://<ELASTIC_IP>/api/v1` |
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret |
| `S3_FRONTEND_BUCKET` | `tnp-frontend-prod` |
| `CF_DISTRIBUTION_ID` | CloudFront distribution ID |

After adding secrets, push to `main` — the pipeline auto-deploys backend + frontend.

---

## Step 9 — SES Setup (if not already done)

1. **SES → Verified identities → Create identity**
2. Verify your sender email (`noreply@yourdomain.com` or a Gmail)
3. If your account is in **SES Sandbox**, move to production:
   - SES → Account dashboard → Request Production Access

---

## Useful PM2 Commands (on EC2)

```bash
pm2 status              # check process status
pm2 logs tnp-backend    # tail logs
pm2 reload tnp-backend  # zero-downtime reload
pm2 restart tnp-backend # hard restart
```

---

## Health Check URLs

| URL | Expected |
|---|---|
| `http://<EC2_IP>/health` | `{"ok":true,"service":"tnp-backend"}` |
| `http://<EC2_IP>/api/v1/jobs` | JSON array of jobs |
| `https://<CF_DOMAIN>.cloudfront.net` | React app loads |
