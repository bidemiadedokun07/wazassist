# WazAssist AI - Deployment Guide

Complete guide for deploying WazAssist AI to production environments.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Production Deployment](#production-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Overview

WazAssist AI is a full-stack application consisting of:
- **Backend**: Node.js/Express API server
- **Frontend**: React SPA with Vite
- **Database**: PostgreSQL (Docker for dev, AWS Aurora for production)
- **Infrastructure**: AWS-based (optional, can deploy anywhere)

---

## Prerequisites

### Required Software
```bash
# Node.js v18+ and npm
node --version  # v18.0.0 or higher
npm --version   # v9.0.0 or higher

# Docker & Docker Compose (for local development)
docker --version
docker-compose --version

# PostgreSQL Client (optional, for debugging)
psql --version

# Git
git --version
```

### AWS Account (for production)
- AWS Account with appropriate IAM permissions
- AWS CLI configured (`aws configure`)
- Access to:
  - RDS (Aurora PostgreSQL)
  - S3 (file storage)
  - Bedrock (AI/LLM)
  - ElastiCache (Redis - optional)
  - CloudWatch (logging)

---

## Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/wazassist-app.git
cd wazassist-app
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 3. Start PostgreSQL Database
```bash
# Start PostgreSQL using Docker Compose
docker-compose up -d

# Verify database is running
docker ps | grep postgres
```

### 4. Configure Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your local settings
# Minimum required for local development:
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=wazassist
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
JWT_SECRET=your-jwt-secret  # Generate with: openssl rand -hex 64
WHATSAPP_VERIFY_TOKEN=your-verify-token
```

### 5. Run Database Migrations
```bash
# Run migrations to create database schema
node backend/src/db/migrate.js
```

### 6. Seed Test Data (Optional)
```bash
# Populate database with test data
node backend/src/db/seed-simple.js
```

### 7. Start Development Servers
```bash
# Terminal 1: Start backend server
npm run dev

# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

### 8. Access the Application
- Frontend: http://localhost:5173 or http://localhost:5174
- Backend API: http://localhost:3000
- API Health Check: http://localhost:3000/health

### Test Credentials (if using seed data)
```
Phone: +2348099999998
Password: Test@1234
```

---

## Database Setup

### Running Migrations

Migrations create and update the database schema. They're located in `backend/src/db/migrations/`.

```bash
# Run all pending migrations
node backend/src/db/migrate.js

# Create a new migration
cd backend/src/db/migrations
touch $(date +%Y%m%d%H%M%S)_migration_name.sql
```

### Migration Files Structure
```sql
-- 20251230000000_example_migration.sql
-- Up Migration
CREATE TABLE IF NOT EXISTS example_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Down Migration (for rollback)
-- DROP TABLE IF EXISTS example_table;
```

### Seeding Data

Two seed scripts are available:

1. **Simple Seed** (`backend/src/db/seed-simple.js`)
   - Creates 1 test user, 1 business, 5 products
   - Quick setup for basic testing

2. **Full Seed** (`backend/src/db/seed.js`)
   - Creates multiple users, businesses, products, orders
   - Comprehensive test data with orders and conversations

```bash
# Run simple seed
node backend/src/db/seed-simple.js

# Run full seed
node backend/src/db/seed.js
```

### Database Backup & Restore

```bash
# Backup database
docker exec -t postgres-container pg_dump -U postgres wazassist > backup.sql

# Restore database
docker exec -i postgres-container psql -U postgres wazassist < backup.sql
```

---

## Environment Configuration

### Critical Environment Variables

#### Database
```bash
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_NAME=wazassist
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-secure-password
DATABASE_SSL=true  # true for production
```

#### Authentication
```bash
# Generate secure secrets:
# openssl rand -hex 64
JWT_SECRET=your-64-char-hex-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d
```

#### WhatsApp Business API
```bash
WHATSAPP_API_VERSION=v18.0
WHATSAPP_API_URL=https://graph.facebook.com
WHATSAPP_VERIFY_TOKEN=your-webhook-verify-token
WHATSAPP_APP_SECRET=your-app-secret
```

#### AWS Services (Production)
```bash
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Bedrock (AI)
BEDROCK_MODEL_ID_8B=meta.llama3-1-8b-instruct-v1:0
BEDROCK_DEFAULT_MODEL=8B

# S3 Storage
S3_BUCKET_MEDIA=wazassist-media-prod
S3_REGION=eu-west-1
```

#### Payment Gateways (Nigerian)
```bash
# Paystack
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_WEBHOOK_SECRET=your-webhook-secret

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx
```

### Frontend Environment Variables

Create `frontend/.env`:
```bash
# API Configuration
VITE_API_URL=/api/v1

# App Configuration
VITE_APP_NAME=WazAssist AI
VITE_APP_VERSION=1.0.0
```

---

## Production Deployment

### Option 1: AWS ECS/Fargate (Recommended)

#### 1. Build Docker Images
```bash
# Build backend image
docker build -t wazassist-backend:latest -f backend/Dockerfile .

# Build frontend image
docker build -t wazassist-frontend:latest -f frontend/Dockerfile .

# Tag for ECR
docker tag wazassist-backend:latest <aws-account>.dkr.ecr.eu-west-1.amazonaws.com/wazassist-backend:latest
docker tag wazassist-frontend:latest <aws-account>.dkr.ecr.eu-west-1.amazonaws.com/wazassist-frontend:latest
```

#### 2. Push to AWS ECR
```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin <aws-account>.dkr.ecr.eu-west-1.amazonaws.com

# Push images
docker push <aws-account>.dkr.ecr.eu-west-1.amazonaws.com/wazassist-backend:latest
docker push <aws-account>.dkr.ecr.eu-west-1.amazonaws.com/wazassist-frontend:latest
```

#### 3. Deploy to ECS
```bash
# Update ECS service
aws ecs update-service \
  --cluster wazassist-cluster \
  --service wazassist-backend \
  --force-new-deployment

aws ecs update-service \
  --cluster wazassist-cluster \
  --service wazassist-frontend \
  --force-new-deployment
```

### Option 2: Traditional VPS (DigitalOcean, Linode, etc.)

#### 1. Server Setup
```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib
```

#### 2. Deploy Application
```bash
# Clone repository
git clone https://github.com/your-org/wazassist-app.git
cd wazassist-app

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Build frontend
cd frontend
npm run build
cd ..

# Setup environment variables
cp .env.example .env
nano .env  # Edit with production values
```

#### 3. Setup PM2
```bash
# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'wazassist-backend',
    script: './backend/src/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Setup Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt-get install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/wazassist

# Add configuration:
server {
    listen 80;
    server_name api.wazassist.ai;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name dashboard.wazassist.ai;
    root /var/www/wazassist/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/wazassist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.wazassist.ai -d dashboard.wazassist.ai
```

### Option 3: Heroku

#### 1. Create Heroku Apps
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create apps
heroku create wazassist-api
heroku create wazassist-dashboard
```

#### 2. Add PostgreSQL
```bash
heroku addons:create heroku-postgresql:standard-0 -a wazassist-api
```

#### 3. Set Environment Variables
```bash
heroku config:set NODE_ENV=production -a wazassist-api
heroku config:set JWT_SECRET=your-secret -a wazassist-api
# ... set all required vars
```

#### 4. Deploy
```bash
# Backend
git subtree push --prefix backend heroku main

# Frontend
cd frontend
npm run build
# Deploy dist folder to static hosting (Vercel, Netlify, etc.)
```

---

## Monitoring & Maintenance

### Health Checks

Backend health endpoint: `GET /health`

```json
{
  "status": "ok",
  "timestamp": "2025-12-30T07:00:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

### Logging

Logs are managed by Winston and can be viewed:

```bash
# PM2 logs
pm2 logs wazassist-backend

# Docker logs
docker logs -f backend-container

# AWS CloudWatch (production)
aws logs tail /aws/ecs/wazassist --follow
```

### Database Maintenance

```bash
# Vacuum database (reclaim storage)
psql -U postgres -d wazassist -c "VACUUM ANALYZE;"

# Check database size
psql -U postgres -d wazassist -c "SELECT pg_size_pretty(pg_database_size('wazassist'));"

# List largest tables
psql -U postgres -d wazassist -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

### Backup Strategy

```bash
# Automated daily backups
crontab -e

# Add line:
0 2 * * * /usr/bin/pg_dump -U postgres wazassist > /backups/wazassist-$(date +\%Y\%m\%d).sql
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check database is running
docker ps | grep postgres

# Check connection string
psql postgresql://postgres:password@localhost:5432/wazassist

# Check firewall rules (production)
telnet your-db-host 5432
```

#### 2. Migration Failures
```bash
# Check migration status
node backend/src/db/migrate.js --status

# Rollback last migration
node backend/src/db/migrate.js --rollback

# Re-run migrations
node backend/src/db/migrate.js
```

#### 3. Authentication Issues
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Check token expiry in .env
JWT_EXPIRES_IN=1h

# Clear browser localStorage
# Open DevTools -> Application -> Local Storage -> Clear
```

#### 4. Frontend Build Errors
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules dist .vite
npm install
npm run build
```

#### 5. API 404 Errors
```bash
# Check backend is running
curl http://localhost:3000/health

# Check proxy configuration (frontend/.env)
VITE_API_URL=/api/v1

# Check Vite proxy (vite.config.ts)
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true
  }
}
```

### Performance Optimization

#### Database
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_orders_business_id ON orders(business_id);
CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_conversations_business_id ON conversations(business_id);
```

#### Backend
```javascript
// Enable response compression
import compression from 'compression';
app.use(compression());

// Implement caching
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 });
```

#### Frontend
```bash
# Optimize build
npm run build -- --mode production

# Analyze bundle size
npm run build -- --analyze
```

---

## Security Checklist

### Before Production Deployment

- [ ] Change all default passwords
- [ ] Generate secure JWT secrets (64 characters minimum)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly (restrict origins)
- [ ] Enable rate limiting
- [ ] Set up database SSL connections
- [ ] Configure secure headers (Helmet.js)
- [ ] Enable audit logging
- [ ] Set up AWS WAF (if using AWS)
- [ ] Configure backup and disaster recovery
- [ ] Review and restrict IAM permissions
- [ ] Enable MFA for admin accounts
- [ ] Set up monitoring and alerting
- [ ] Configure log retention policies
- [ ] Implement secrets management (AWS Secrets Manager)
- [ ] Review and update dependencies
- [ ] Run security audit (`npm audit`)
- [ ] Configure environment-specific settings
- [ ] Set up health checks and auto-scaling
- [ ] Document rollback procedures
- [ ] Test disaster recovery plan

---

## Support & Resources

### Documentation
- [API Documentation](./API.md)
- [User Guide](./USER_GUIDE.md)
- [Architecture Overview](./ARCHITECTURE.md)

### Community
- GitHub Issues: https://github.com/your-org/wazassist-app/issues
- Discord: https://discord.gg/wazassist
- Email: support@wazassist.ai

### AWS Resources
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)

---

## License

Copyright © 2025 WazAssist AI. All rights reserved.
