# WazAssist AI - Production Setup Guide

Complete step-by-step guide to set up your production database and obtain all required environment variables.

## Table of Contents
1. [Database Setup](#database-setup)
2. [Redis Setup](#redis-setup)
3. [JWT Secrets Generation](#jwt-secrets-generation)
4. [AWS Configuration](#aws-configuration)
5. [WhatsApp Business API](#whatsapp-business-api)
6. [Payment Gateways](#payment-gateways)
7. [Complete .env.production File](#complete-envproduction-file)

---

## Database Setup

### Option 1: AWS RDS PostgreSQL (Recommended for Production)

#### Step 1: Create RDS Instance

1. **Log into AWS Console** → Navigate to RDS

2. **Create Database**:
   - Click "Create database"
   - Engine type: **PostgreSQL**
   - Version: **PostgreSQL 16.x**
   - Template: **Production**

3. **Instance Configuration**:
   - DB instance class: **db.t3.medium** (2 vCPU, 4 GB RAM)
   - For high traffic: **db.r6g.large** or higher

4. **Storage**:
   - Storage type: **General Purpose SSD (gp3)**
   - Allocated storage: **50 GB** (minimum)
   - Enable storage autoscaling: **Yes**
   - Maximum storage threshold: **100 GB**

5. **Connectivity**:
   - VPC: Select your VPC
   - Public access: **Yes** (if accessing from outside AWS)
   - VPC security group: Create new or use existing
   - Availability Zone: **No preference**

6. **Database Authentication**:
   - Master username: **wazassist_admin**
   - Master password: **Generate strong password** (save it!)
   - Confirm password

7. **Initial Database Name**: **wazassist_prod**

8. **Backup**:
   - Enable automated backups: **Yes**
   - Backup retention period: **7 days** (or more)
   - Backup window: Choose a low-traffic time

9. **Encryption**:
   - Enable encryption: **Yes**

10. **Maintenance**:
    - Enable auto minor version upgrade: **Yes**

11. **Click "Create database"** (takes 5-10 minutes)

#### Step 2: Configure Security Group

1. Go to **EC2** → **Security Groups**
2. Find the RDS security group
3. **Edit inbound rules**:
   ```
   Type: PostgreSQL
   Protocol: TCP
   Port: 5432
   Source: Your application server IP or security group
   ```

#### Step 3: Get Database Connection Details

After database is created:

1. Go to **RDS** → **Databases** → Click your database
2. **Endpoint & port** section:
   ```
   Endpoint: wazassist-prod.xxxxxxxxxxxxx.eu-west-1.rds.amazonaws.com
   Port: 5432
   ```

#### Step 4: Create Application Database User

```bash
# Connect to RDS as admin
psql -h wazassist-prod.xxxxxxxxxxxxx.eu-west-1.rds.amazonaws.com \
     -U wazassist_admin \
     -d wazassist_prod

# Create application user
CREATE USER wazassist_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE wazassist_prod TO wazassist_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wazassist_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wazassist_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO wazassist_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO wazassist_user;

# Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Exit
\q
```

#### Your Database Environment Variables:
```bash
DATABASE_HOST=wazassist-prod.xxxxxxxxxxxxx.eu-west-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=wazassist_prod
DATABASE_USER=wazassist_user
DATABASE_PASSWORD=your_secure_password_here
DATABASE_SSL=true
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
```

### Option 2: DigitalOcean Managed PostgreSQL

#### Step 1: Create Database Cluster

1. **Log into DigitalOcean** → **Databases**
2. **Create Database Cluster**:
   - Database engine: **PostgreSQL 16**
   - Plan: **Basic** ($15/month) or **Professional** ($60/month)
   - Datacenter region: Choose closest to your users
   - Cluster name: **wazassist-prod**

3. **Click "Create Database Cluster"** (takes 5 minutes)

#### Step 2: Configure Access

1. **Trusted Sources**:
   - Add your application server IP
   - Or allow all sources (less secure)

2. **Connection Details**:
   - Go to **Overview** tab
   - Copy connection parameters

#### Step 3: Create Database and User

```bash
# Connect using provided connection string
psql "postgresql://doadmin:password@host:25060/defaultdb?sslmode=require"

# Create database
CREATE DATABASE wazassist_prod;

# Create user
CREATE USER wazassist_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE wazassist_prod TO wazassist_user;

# Switch to new database
\c wazassist_prod

# Grant privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wazassist_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wazassist_user;

# Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

#### Your Database Environment Variables:
```bash
DATABASE_HOST=db-postgresql-xxx-do-user-xxx.db.ondigitalocean.com
DATABASE_PORT=25060
DATABASE_NAME=wazassist_prod
DATABASE_USER=wazassist_user
DATABASE_PASSWORD=your_secure_password
DATABASE_SSL=true
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
```

### Option 3: Self-Hosted PostgreSQL

#### Step 1: Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-16 postgresql-contrib-16

# CentOS/RHEL
sudo yum install postgresql16-server postgresql16-contrib
sudo postgresql-16-setup initdb
sudo systemctl enable postgresql-16
sudo systemctl start postgresql-16
```

#### Step 2: Configure PostgreSQL

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/16/main/postgresql.conf

# Update these settings:
listen_addresses = '*'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
```

```bash
# Edit access control
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Add this line (adjust IP as needed):
host    all             all             0.0.0.0/0            scram-sha-256
```

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Step 3: Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE wazassist_prod;

# Create user
CREATE USER wazassist_user WITH ENCRYPTED PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE wazassist_prod TO wazassist_user;
ALTER DATABASE wazassist_prod OWNER TO wazassist_user;

# Connect to database
\c wazassist_prod

# Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

#### Your Database Environment Variables:
```bash
DATABASE_HOST=your-server-ip-or-domain
DATABASE_PORT=5432
DATABASE_NAME=wazassist_prod
DATABASE_USER=wazassist_user
DATABASE_PASSWORD=your_secure_password
DATABASE_SSL=false  # or true if you configure SSL
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
```

---

## Redis Setup

### Option 1: AWS ElastiCache for Redis

#### Step 1: Create Redis Cluster

1. **AWS Console** → **ElastiCache**
2. **Create** → **Redis cluster**
3. **Configuration**:
   - Cluster mode: **Disabled**
   - Name: **wazassist-redis**
   - Engine version: **7.0**
   - Node type: **cache.t3.micro** (for testing) or **cache.t3.small** (production)
   - Number of replicas: **1** (for high availability)

4. **Subnet group**:
   - Create new or select existing
   - Select subnets in different availability zones

5. **Security**:
   - Security groups: Same as your application
   - Encryption at rest: **Enabled**
   - Encryption in transit: **Enabled**
   - Auth token: **Enable** and set a password

6. **Backup**:
   - Enable automatic backups: **Yes**
   - Backup retention: **5 days**

7. **Click "Create"** (takes 10-15 minutes)

#### Step 2: Get Connection Details

1. Go to **ElastiCache** → **Redis clusters**
2. Click your cluster
3. **Primary endpoint**:
   ```
   wazassist-redis.xxxxx.ng.0001.use1.cache.amazonaws.com:6379
   ```

#### Your Redis Environment Variables:
```bash
REDIS_HOST=wazassist-redis.xxxxx.ng.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your_auth_token_here
REDIS_TLS=true
```

### Option 2: DigitalOcean Managed Redis

#### Step 1: Create Redis Cluster

1. **DigitalOcean** → **Databases** → **Create Database**
2. **Engine**: **Redis 7**
3. **Plan**: Choose based on needs
4. **Datacenter**: Same as your application
5. **Click "Create Database Cluster"**

#### Step 2: Get Connection Details

1. **Overview** tab shows:
   - Host
   - Port (25061)
   - Password

#### Your Redis Environment Variables:
```bash
REDIS_HOST=db-redis-xxx-do-user-xxx.db.ondigitalocean.com
REDIS_PORT=25061
REDIS_PASSWORD=provided_password
REDIS_TLS=true
```

### Option 3: Self-Hosted Redis (Docker)

```bash
# Create Redis password
REDIS_PASSWORD=$(openssl rand -base64 32)
echo "REDIS_PASSWORD=$REDIS_PASSWORD"

# Run Redis with password
docker run -d \
  --name wazassist-redis \
  --restart unless-stopped \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server \
  --requirepass "$REDIS_PASSWORD" \
  --maxmemory 512mb \
  --maxmemory-policy allkeys-lru \
  --save 900 1 \
  --save 300 10

# Test connection
docker exec -it wazassist-redis redis-cli -a "$REDIS_PASSWORD" ping
# Should return: PONG
```

#### Your Redis Environment Variables:
```bash
REDIS_HOST=localhost  # or your server IP
REDIS_PORT=6379
REDIS_PASSWORD=generated_password_from_above
REDIS_TLS=false
```

---

## JWT Secrets Generation

Generate strong, random secrets for JWT tokens:

```bash
# Generate JWT secret (64 characters)
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET"

# Generate JWT refresh secret (64 characters)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"

# Generate session secret (64 characters)
SESSION_SECRET=$(openssl rand -hex 32)
echo "SESSION_SECRET=$SESSION_SECRET"
```

#### Your JWT Environment Variables:
```bash
JWT_SECRET=generated_64_char_hex_string
JWT_REFRESH_SECRET=generated_64_char_hex_string
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=generated_64_char_hex_string
```

---

## AWS Configuration

### Step 1: Create IAM User for Application

1. **AWS Console** → **IAM** → **Users** → **Add users**
2. **User name**: **wazassist-app**
3. **Access type**: **Programmatic access**
4. **Permissions**:
   - Attach policies directly:
     - **AmazonS3FullAccess** (for file uploads)
     - **AmazonBedrockFullAccess** (for AI features)
   - Or create custom policy (recommended):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::wazassist-production-uploads/*",
        "arn:aws:s3:::wazassist-production-media/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    }
  ]
}
```

5. **Download credentials**:
   - Access key ID: `AKIA...`
   - Secret access key: `wJalrXU...`

### Step 2: Create S3 Buckets

```bash
# Install AWS CLI if not already installed
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# Enter Access Key ID
# Enter Secret Access Key
# Default region: eu-west-1
# Default output: json

# Create S3 buckets
aws s3 mb s3://wazassist-production-uploads --region eu-west-1
aws s3 mb s3://wazassist-production-media --region eu-west-1

# Enable versioning (recommended)
aws s3api put-bucket-versioning \
  --bucket wazassist-production-uploads \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket wazassist-production-uploads \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Set CORS policy for uploads
cat > cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://wazassist.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket wazassist-production-uploads \
  --cors-configuration file://cors.json
```

### Step 3: Enable AWS Bedrock

1. **AWS Console** → **Bedrock** → **Model access**
2. **Request access** to models:
   - **Meta Llama 3.1 8B Instruct** (recommended)
   - **Meta Llama 3.1 70B Instruct** (optional, for complex queries)
3. Wait for approval (usually instant)

#### Your AWS Environment Variables:
```bash
AWS_REGION=eu-west-1
AWS_ACCOUNT_ID=123456789012  # Your AWS account ID
AWS_ACCESS_KEY_ID=AKIA...    # From IAM user creation
AWS_SECRET_ACCESS_KEY=wJalrXU...  # From IAM user creation

# S3 Configuration
AWS_S3_BUCKET=wazassist-production-uploads
AWS_BUCKET_MEDIA=wazassist-production-media

# Bedrock Configuration
AWS_BEDROCK_MODEL_ID=meta.llama3-1-8b-instruct-v1:0
AWS_BEDROCK_MODEL_SIZE=8B
```

---

## WhatsApp Business API

### Step 1: Create Meta Developer Account

1. Go to **https://developers.facebook.com**
2. **Create Account** or **Log In**
3. **Create App** → **Business** → **Continue**
4. **App Name**: WazAssist AI
5. **Contact Email**: Your email

### Step 2: Add WhatsApp Product

1. In your app dashboard, **Add Product**
2. Select **WhatsApp** → **Set up**
3. **Business Portfolio**: Create new or select existing

### Step 3: Get Phone Number

1. **WhatsApp** → **Getting Started**
2. **Test number** provided automatically (for testing)
3. For production: **Add Phone Number**
   - Verify phone number ownership
   - Choose a phone number (can be new or existing business number)

### Step 4: Get Access Token

1. **WhatsApp** → **Getting Started**
2. **Temporary access token** shown (valid 24 hours)
3. For permanent token:
   - **Settings** → **System Users** → **Add**
   - Create system user: **wazassist-api**
   - **Generate Token**:
     - App: Your WhatsApp app
     - Permissions: **whatsapp_business_management**, **whatsapp_business_messaging**
   - **Copy and save the token** (shown only once!)

### Step 5: Configure Webhook

1. **WhatsApp** → **Configuration**
2. **Webhook** section:
   - **Callback URL**: `https://api.wazassist.com/webhooks/whatsapp`
   - **Verify Token**: Generate a random string:
     ```bash
     WHATSAPP_VERIFY_TOKEN=$(openssl rand -hex 16)
     echo "WHATSAPP_VERIFY_TOKEN=$WHATSAPP_VERIFY_TOKEN"
     ```
   - **Webhook fields**: Select all (messages, message_status, etc.)

3. **Subscribe to webhook events**

### Step 6: Get Configuration Details

1. **Phone Number ID**:
   - **WhatsApp** → **API Setup** → **Phone numbers**
   - Copy the Phone Number ID

2. **Business Account ID**:
   - **WhatsApp** → **API Setup**
   - Copy the WhatsApp Business Account ID

#### Your WhatsApp Environment Variables:
```bash
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=generated_random_hex_string
WHATSAPP_WEBHOOK_URL=https://api.wazassist.com/webhooks/whatsapp
WHATSAPP_API_VERSION=v18.0
```

---

## Payment Gateways

### Paystack (Nigerian Payments)

#### Step 1: Create Paystack Account

1. Go to **https://paystack.com**
2. **Sign Up** → Business account
3. **Complete KYC verification** (required for live mode)

#### Step 2: Get API Keys

1. **Settings** → **API Keys & Webhooks**
2. **Copy keys**:
   - **Test Public Key**: `pk_test_...`
   - **Test Secret Key**: `sk_test_...`
   - For production (after KYC):
     - **Live Public Key**: `pk_live_...`
     - **Live Secret Key**: `sk_live_...`

#### Step 3: Configure Webhook

1. **Settings** → **API Keys & Webhooks**
2. **Webhook URL**: `https://api.wazassist.com/webhooks/paystack`
3. **Copy Webhook Secret**

#### Your Paystack Environment Variables:
```bash
PAYSTACK_SECRET_KEY=sk_live_...  # or sk_test_... for testing
PAYSTACK_PUBLIC_KEY=pk_live_...  # or pk_test_... for testing
PAYSTACK_WEBHOOK_SECRET=provided_webhook_secret
```

### Flutterwave (African Payments)

#### Step 1: Create Flutterwave Account

1. Go to **https://flutterwave.com**
2. **Sign Up** → Business account
3. **Complete verification**

#### Step 2: Get API Keys

1. **Settings** → **API Keys**
2. **Copy keys**:
   - **Test Public Key**: `FLWPUBK_TEST-...`
   - **Test Secret Key**: `FLWSECK_TEST-...`
   - **Test Encryption Key**: `FLWSECK_TEST...`
   - For production:
     - **Live Public Key**: `FLWPUBK-...`
     - **Live Secret Key**: `FLWSECK-...`
     - **Live Encryption Key**: `...`

#### Step 3: Configure Webhook

1. **Settings** → **Webhooks**
2. **Webhook URL**: `https://api.wazassist.com/webhooks/flutterwave`
3. **Secret Hash**: Generate and save:
   ```bash
   FLUTTERWAVE_WEBHOOK_SECRET=$(openssl rand -hex 16)
   echo "FLUTTERWAVE_WEBHOOK_SECRET=$FLUTTERWAVE_WEBHOOK_SECRET"
   ```

#### Your Flutterwave Environment Variables:
```bash
FLUTTERWAVE_SECRET_KEY=FLWSECK-...  # Live or test
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-...  # Live or test
FLUTTERWAVE_ENCRYPTION_KEY=provided_encryption_key
FLUTTERWAVE_WEBHOOK_SECRET_HASH=generated_hash_from_above
```

---

## Complete .env.production File

Create your production environment file:

```bash
cd /path/to/WazAssist_App
cp .env.production.example .env.production
nano .env.production
```

**Complete template with all values:**

```bash
# ==============================================
# WazAssist AI - Production Environment
# ==============================================

# ------------------
# Application
# ------------------
NODE_ENV=production
PORT=3000
APP_NAME=WazAssist AI
APP_BASE_URL=https://api.wazassist.com
FRONTEND_URL=https://wazassist.com

# ------------------
# Database (PostgreSQL)
# ------------------
DATABASE_HOST=your-database-host.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=wazassist_prod
DATABASE_USER=wazassist_user
DATABASE_PASSWORD=your_database_password_here
DATABASE_SSL=true
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# ------------------
# Redis (Session & Cache)
# ------------------
REDIS_HOST=your-redis-host.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here
REDIS_TLS=true

# ------------------
# JWT Authentication
# ------------------
JWT_SECRET=your_64_char_hex_secret_here
JWT_REFRESH_SECRET=your_64_char_refresh_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=your_session_secret_here

# ------------------
# AWS Configuration
# ------------------
AWS_REGION=eu-west-1
AWS_ACCOUNT_ID=123456789012
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXU...

# AWS S3 for file uploads
AWS_S3_BUCKET=wazassist-production-uploads
AWS_BUCKET_MEDIA=wazassist-production-media

# AWS Bedrock for AI
AWS_BEDROCK_MODEL_ID=meta.llama3-1-8b-instruct-v1:0
AWS_BEDROCK_MODEL_SIZE=8B

# ------------------
# WhatsApp Business API
# ------------------
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_WEBHOOK_URL=https://api.wazassist.com/webhooks/whatsapp
WHATSAPP_API_VERSION=v18.0

# ------------------
# Payment Gateways
# ------------------
# Paystack
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

# Flutterwave
FLUTTERWAVE_SECRET_KEY=FLWSECK-...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-...
FLUTTERWAVE_ENCRYPTION_KEY=your_encryption_key
FLUTTERWAVE_WEBHOOK_SECRET_HASH=your_webhook_hash

# ------------------
# Security
# ------------------
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://wazassist.com
BLOCK_SUSPICIOUS_REQUESTS=true

# ------------------
# Rate Limiting
# ------------------
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ------------------
# Logging & Monitoring
# ------------------
LOG_LEVEL=info
LOG_FILE=logs/wazassist-production.log

# CloudWatch (optional)
CLOUDWATCH_LOG_GROUP=/aws/wazassist/production
CLOUDWATCH_LOG_STREAM=api-server

# Sentry (optional)
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production

# ------------------
# Feature Flags
# ------------------
ENABLE_ANALYTICS=true
ENABLE_AI_RESPONSES=true
ENABLE_FILE_UPLOADS=true
ENABLE_TEAM_MANAGEMENT=true
```

---

## Verification Checklist

After setting up all environment variables:

```bash
# 1. Test database connection
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT 1;"

# 2. Test Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping

# 3. Test AWS credentials
aws s3 ls s3://$AWS_S3_BUCKET

# 4. Test AWS Bedrock access
aws bedrock list-foundation-models --region $AWS_REGION

# 5. Verify .env.production file
cat .env.production | grep -v "PASSWORD\|SECRET\|KEY" | grep "="

# 6. Start application and check health
docker-compose -f docker-compose.prod.yml up -d
sleep 10
curl http://localhost:3000/health
```

---

## Security Best Practices

1. **Never commit .env.production to version control**
   ```bash
   echo ".env.production" >> .gitignore
   ```

2. **Restrict file permissions**
   ```bash
   chmod 600 .env.production
   ```

3. **Use AWS Secrets Manager (recommended for production)**
   ```bash
   # Store secrets in AWS Secrets Manager
   aws secretsmanager create-secret \
     --name wazassist/production/database \
     --secret-string '{"password":"your_db_password"}'

   # Retrieve in application
   aws secretsmanager get-secret-value \
     --secret-id wazassist/production/database
   ```

4. **Rotate secrets regularly**
   - Database passwords: Every 90 days
   - JWT secrets: Every 180 days
   - API keys: As needed

5. **Use environment-specific keys**
   - Development: Test keys only
   - Staging: Separate keys from production
   - Production: Live keys with restricted permissions

---

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
telnet $DATABASE_HOST $DATABASE_PORT

# Check SSL requirement
psql "postgresql://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME?sslmode=require"
```

### Redis Connection Issues
```bash
# Test connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD --tls ping
```

### AWS Access Issues
```bash
# Verify credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://$AWS_S3_BUCKET

# Test Bedrock access
aws bedrock list-foundation-models --region $AWS_REGION
```

---

## Next Steps

After completing this setup:

1. **Run database migrations** - See [QUICK_START.md](./QUICK_START.md)
2. **Deploy application** - See [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Configure monitoring** - See [OPERATIONS.md](./OPERATIONS.md)
4. **Set up backups** - See [OPERATIONS.md](./OPERATIONS.md)

---

**Support**: If you encounter issues, check the troubleshooting sections or contact support.
