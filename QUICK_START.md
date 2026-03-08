# WazAssist AI - Quick Start Guide

This is a quick reference guide to get WazAssist AI up and running in different environments.

## Table of Contents
- [Development Setup (5 minutes)](#development-setup-5-minutes)
- [Production Deployment (Docker)](#production-deployment-docker)
- [Production Deployment (Manual)](#production-deployment-manual)
- [Common Commands](#common-commands)

---

## Development Setup (5 minutes)

### Prerequisites
- Node.js 20.x
- Docker & Docker Compose
- Git

### Steps

```bash
# 1. Clone repository
git clone <repository-url>
cd WazAssist_App

# 2. Install dependencies
npm install
cd frontend && npm install && cd ..

# 3. Start PostgreSQL
docker-compose up -d

# 4. Configure environment
cp .env.example .env
# Edit .env with your settings (minimum: DATABASE_PASSWORD, JWT_SECRET)

# 5. Run migrations
curl -X POST http://localhost:3000/api/v1/admin/migrate/001_initial_schema \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Start servers
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

---

## Production Deployment (Docker)

### Prerequisites
- Docker 24.x+
- Docker Compose 2.x+
- Domain with SSL certificate
- Production environment variables configured

### Quick Deploy

```bash
# 1. Clone and configure
git clone <repository-url>
cd WazAssist_App
cp .env.production.example .env.production
# Edit .env.production with production values

# 2. Place SSL certificates
mkdir -p nginx/ssl
# Copy your SSL certificates to nginx/ssl/

# 3. Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Run migrations
curl -X POST http://localhost:3000/api/v1/admin/migrate/001_initial_schema \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 5. Verify deployment
curl http://localhost:3000/health
```

---

## Common Commands

### Development

```bash
# Start backend dev server
npm run dev

# Start frontend dev server
cd frontend && npm run dev

# Check health
curl http://localhost:3000/health
```

### Production (Docker)

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Restart service
docker-compose -f docker-compose.prod.yml restart app

# Update and redeploy
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

### Production (PM2)

```bash
# View status
pm2 status

# Restart
pm2 restart wazassist-api

# View logs
pm2 logs wazassist-api
```

---

For detailed documentation, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [OPERATIONS.md](./OPERATIONS.md) - Operations runbook
