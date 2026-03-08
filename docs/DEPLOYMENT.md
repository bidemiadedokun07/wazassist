# WazAssist AI - Deployment Guide

Complete guide for deploying WazAssist AI to production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Deployment](#database-deployment)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [WhatsApp Business API Setup](#whatsapp-business-api-setup)
- [Payment Gateway Configuration](#payment-gateway-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Considerations](#security-considerations)
- [Scaling](#scaling)

---

## Prerequisites

### Required Services
- **AWS Account** (for RDS, Cognito, S3, EC2/ECS)
- **Node.js** v18+ and npm/yarn
- **PostgreSQL** 14+
- **Domain name** with SSL certificate
- **WhatsApp Business API** access (Meta Business Suite)
- **Paystack Account** (Nigerian payment gateway)
- **Flutterwave Account** (Nigerian payment gateway)
- **OpenAI API Key** (for AI chat functionality)

### Required Tools
- AWS CLI configured with appropriate credentials
- Docker and Docker Compose (for containerized deployment)
- Git
- PM2 or systemd (for process management)

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/wazassist-ai.git
cd wazassist-ai
```

### 2. Create Environment Files

#### Backend Environment (.env)
Create `backend/.env` with the following:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://api.yourdomain.com
APP_LOGO_URL=https://yourdomain.com/logo.png

# Database Configuration (AWS RDS)
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=wazassist_production
DB_USER=wazassist_admin
DB_PASSWORD=your-secure-password
DB_SSL=true

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# AWS Cognito
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=us-east-1

# WhatsApp Business API
WHATSAPP_API_TOKEN=your-whatsapp-api-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-custom-verify-token
WHATSAPP_WEBHOOK_SECRET=your-webhook-secret

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_live_your-secret-key
PAYSTACK_PUBLIC_KEY=pk_live_your-public-key

# Flutterwave Configuration
FLUTTERWAVE_SECRET_KEY=FLWSECK-your-secret-key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your-public-key
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST-your-encryption-key
FLUTTERWAVE_SECRET_HASH=your-secret-hash

# Frontend URL (for payment redirects)
FRONTEND_URL=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
```

#### Frontend Environment (.env)
Create `frontend/.env` with:

```bash
REACT_APP_API_URL=https://api.yourdomain.com/api/v1
REACT_APP_WS_URL=wss://api.yourdomain.com
REACT_APP_ENV=production
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
REACT_APP_COGNITO_CLIENT_ID=your-client-id
REACT_APP_COGNITO_REGION=us-east-1
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_live_your-public-key
REACT_APP_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your-public-key
```

---

## Database Deployment

### Option 1: AWS RDS (Recommended for Production)

#### 1. Create RDS PostgreSQL Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier wazassist-production \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.7 \
  --master-username wazassist_admin \
  --master-user-password your-secure-password \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name your-subnet-group \
  --publicly-accessible false \
  --enable-performance-insights \
  --performance-insights-retention-period 7
```

#### 2. Configure Security Group
- Allow inbound traffic on port 5432 from your application servers
- Restrict access to specific IP ranges or security groups

#### 3. Run Database Migrations
```bash
cd backend
npm install
npm run migrate:up
```

### Option 2: Self-Hosted PostgreSQL

#### Install PostgreSQL
```bash
sudo apt update
sudo apt install postgresql-14 postgresql-contrib
```

#### Configure PostgreSQL
```bash
sudo -u postgres psql

CREATE DATABASE wazassist_production;
CREATE USER wazassist_admin WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE wazassist_production TO wazassist_admin;
```

#### Run Migrations
```bash
cd backend
npm install
npm run migrate:up
```

---

## Backend Deployment

### Option 1: AWS EC2 with PM2 (Recommended)

#### 1. Launch EC2 Instance
```bash
# Launch t3.medium instance with Amazon Linux 2 or Ubuntu 22.04
# Configure security group to allow:
# - Port 22 (SSH)
# - Port 3000 (API)
# - Port 443 (HTTPS via ALB)
```

#### 2. Install Dependencies
```bash
ssh ubuntu@your-ec2-ip

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install build tools
sudo apt install -y build-essential
```

#### 3. Deploy Application
```bash
# Clone repository
git clone https://github.com/yourusername/wazassist-ai.git
cd wazassist-ai/backend

# Install dependencies
npm ci --production

# Create .env file
nano .env
# Paste your production environment variables

# Start application with PM2
pm2 start src/index.js --name wazassist-backend -i max

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 4. Configure Nginx as Reverse Proxy
```bash
sudo apt install nginx

sudo nano /etc/nginx/sites-available/wazassist
```

Add configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/wazassist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile
Backend already has `Dockerfile`. Build and run:

```bash
cd backend

# Build image
docker build -t wazassist-backend:latest .

# Run container
docker run -d \
  --name wazassist-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  wazassist-backend:latest
```

#### 2. Docker Compose Setup
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    env_file:
      - ./backend/.env
    restart: unless-stopped
    depends_on:
      - postgres

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: wazassist_production
      POSTGRES_USER: wazassist_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

### Option 3: AWS ECS/Fargate

#### 1. Push Docker Image to ECR
```bash
# Create ECR repository
aws ecr create-repository --repository-name wazassist-backend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com

# Build and tag image
docker build -t wazassist-backend:latest ./backend
docker tag wazassist-backend:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/wazassist-backend:latest

# Push to ECR
docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/wazassist-backend:latest
```

#### 2. Create ECS Task Definition
Create `task-definition.json`:
```json
{
  "family": "wazassist-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "wazassist-backend",
      "image": "your-account-id.dkr.ecr.us-east-1.amazonaws.com/wazassist-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:account:secret:wazassist/db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/wazassist-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 3. Create ECS Service
```bash
aws ecs create-service \
  --cluster wazassist-production \
  --service-name wazassist-backend-service \
  --task-definition wazassist-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=wazassist-backend,containerPort=3000"
```

---

## Frontend Deployment

### Option 1: AWS S3 + CloudFront (Recommended)

#### 1. Build Frontend
```bash
cd frontend
npm ci
npm run build
```

#### 2. Create S3 Bucket
```bash
aws s3 mb s3://wazassist-frontend
aws s3 website s3://wazassist-frontend --index-document index.html --error-document index.html
```

#### 3. Upload Build Files
```bash
aws s3 sync build/ s3://wazassist-frontend --delete
```

#### 4. Create CloudFront Distribution
```bash
aws cloudfront create-distribution \
  --origin-domain-name wazassist-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

#### 5. Configure Custom Domain
- Add CNAME record pointing to CloudFront distribution
- Configure SSL certificate in ACM

### Option 2: Vercel Deployment

```bash
cd frontend
npm install -g vercel
vercel --prod
```

### Option 3: Nginx Static Hosting

```bash
cd frontend
npm run build

sudo cp -r build/* /var/www/wazassist/
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/wazassist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://api.yourdomain.com;
    }
}
```

---

## WhatsApp Business API Setup

### 1. Create Meta Business Account
- Go to https://business.facebook.com
- Create a new Business Account
- Verify your business

### 2. Setup WhatsApp Business API
- Go to https://developers.facebook.com
- Create a new App
- Add WhatsApp product
- Get access to WhatsApp Business API

### 3. Configure Phone Number
- Add a phone number to your WhatsApp Business account
- Verify the phone number
- Get the Phone Number ID and Business Account ID

### 4. Configure Webhook
```bash
# Webhook URL: https://api.yourdomain.com/api/v1/webhooks/whatsapp
# Verify Token: your-custom-verify-token (from .env)

# Subscribe to webhook events:
# - messages
# - message_status
```

### 5. Test Webhook
```bash
curl -X POST "https://graph.facebook.com/v18.0/your-phone-number-id/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "+2348012345678",
    "type": "text",
    "text": {
      "body": "Hello from WazAssist!"
    }
  }'
```

---

## Payment Gateway Configuration

### Paystack Setup

#### 1. Create Paystack Account
- Go to https://paystack.com
- Sign up and verify your business
- Complete KYC requirements

#### 2. Get API Keys
- Login to Paystack Dashboard
- Go to Settings > API Keys & Webhooks
- Copy Secret Key and Public Key
- Switch to Live mode for production

#### 3. Configure Webhook
```bash
# Webhook URL: https://api.yourdomain.com/api/v1/payments/paystack/webhook
# Events to subscribe:
# - charge.success
# - charge.failure
```

### Flutterwave Setup

#### 1. Create Flutterwave Account
- Go to https://flutterwave.com
- Sign up and verify your business
- Complete KYC requirements

#### 2. Get API Keys
- Login to Flutterwave Dashboard
- Go to Settings > API
- Copy Secret Key, Public Key, and Encryption Key
- Generate Secret Hash for webhooks

#### 3. Configure Webhook
```bash
# Webhook URL: https://api.yourdomain.com/api/v1/payments/flutterwave/webhook
# Secret Hash: your-secret-hash (from .env)
```

---

## Monitoring and Logging

### 1. Application Monitoring with PM2

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs wazassist-backend

# View metrics
pm2 describe wazassist-backend
```

### 2. AWS CloudWatch (for ECS/EC2)

Create CloudWatch Alarms:
```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name wazassist-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### 3. Application Logging

Backend uses Winston logger. Configure log aggregation:
```bash
# CloudWatch Logs Agent
sudo yum install amazon-cloudwatch-agent

# Configure agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json \
  -s
```

### 4. Error Tracking with Sentry (Optional)

```bash
npm install @sentry/node

# Add to backend/src/index.js
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

---

## Security Considerations

### 1. Environment Variables
- Never commit .env files to version control
- Use AWS Secrets Manager or Parameter Store for sensitive data
- Rotate credentials regularly

### 2. Database Security
- Use SSL/TLS for database connections
- Restrict database access to application servers only
- Enable encryption at rest
- Regular backups

### 3. API Security
- Rate limiting configured (100 req/min per IP)
- CORS properly configured
- Helmet.js for security headers
- Input validation and sanitization

### 4. WhatsApp Webhook Security
- Verify webhook signatures
- Use HTTPS only
- Validate webhook payloads

### 5. Payment Security
- PCI DSS compliance
- Verify payment webhook signatures
- Never store card details
- Use HTTPS for all payment flows

### 6. Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Scaling

### Horizontal Scaling

#### 1. Load Balancer Setup (AWS ALB)
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name wazassist-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create Target Group
aws elbv2 create-target-group \
  --name wazassist-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --health-check-path /health
```

#### 2. Auto Scaling (ECS)
```bash
# Configure auto scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/wazassist-production/wazassist-backend-service \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/wazassist-production/wazassist-backend-service \
  --policy-name wazassist-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

### Database Scaling

#### Read Replicas
```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier wazassist-read-replica \
  --source-db-instance-identifier wazassist-production \
  --db-instance-class db.t3.medium
```

#### Connection Pooling
- Already configured in `backend/src/config/database.js`
- Max connections: 20 per instance
- Adjust based on instance count

### Caching Strategy

#### Redis Setup (Optional)
```bash
# AWS ElastiCache
aws elasticache create-cache-cluster \
  --cache-cluster-id wazassist-cache \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates obtained
- [ ] WhatsApp Business API configured
- [ ] Payment gateways configured (Paystack & Flutterwave)
- [ ] Domain DNS configured
- [ ] Backup strategy in place

### Deployment
- [ ] Database deployed and migrated
- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] Load balancer configured
- [ ] SSL certificates applied
- [ ] Monitoring and logging configured

### Post-Deployment
- [ ] Health checks passing
- [ ] WhatsApp webhook tested
- [ ] Payment flows tested (Paystack & Flutterwave)
- [ ] API endpoints tested
- [ ] Frontend loads correctly
- [ ] Logs are being captured
- [ ] Monitoring alerts configured
- [ ] Backup process verified

### Testing in Production
```bash
# Health check
curl https://api.yourdomain.com/health

# API info
curl https://api.yourdomain.com/api/v1

# Test WhatsApp webhook
# Send a message to your WhatsApp number

# Test payment initialization
curl -X POST https://api.yourdomain.com/api/v1/payments/paystack/initialize \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## Rollback Strategy

### 1. Application Rollback
```bash
# PM2
pm2 reload wazassist-backend --update-env

# Docker
docker pull wazassist-backend:previous-version
docker stop wazassist-backend
docker run ... wazassist-backend:previous-version

# ECS
aws ecs update-service \
  --cluster wazassist-production \
  --service wazassist-backend-service \
  --task-definition wazassist-backend:previous-revision
```

### 2. Database Rollback
```bash
npm run migrate:down
```

---

## Support and Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check security groups
   - Verify credentials
   - Check SSL configuration

2. **WhatsApp Webhook Not Working**
   - Verify webhook URL is accessible
   - Check verify token matches
   - Review webhook logs

3. **Payment Failures**
   - Verify API keys are correct
   - Check webhook signatures
   - Review payment logs

### Logs Location
```bash
# PM2 logs
~/.pm2/logs/

# Docker logs
docker logs wazassist-backend

# ECS logs
# CloudWatch Logs: /ecs/wazassist-backend
```

### Support Contacts
- Technical Support: tech@wazassist.com
- Emergency: +234-XXX-XXX-XXXX
