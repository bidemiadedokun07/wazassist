# WazAssist AI - Developer Setup Guide

Complete guide for setting up WazAssist AI development environment on your local machine.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **npm** v9 or higher (comes with Node.js)
- **PostgreSQL** 14 or higher ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional Tools
- **Postman** or **Insomnia** - for API testing
- **pgAdmin** or **DBeaver** - for database management
- **VS Code** - recommended code editor with extensions:
  - ESLint
  - Prettier
  - GitLens
  - PostgreSQL
  - Thunder Client (API testing)

### Required Accounts (for full functionality)
- **WhatsApp Business API** access (Meta Developer Account)
- **OpenAI API** key ([Get one here](https://platform.openai.com/api-keys))
- **Paystack** test account ([Sign up](https://paystack.com))
- **Flutterwave** test account ([Sign up](https://flutterwave.com))
- **AWS Account** (for Cognito, S3) - optional for local dev

---

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/yourusername/wazassist-ai.git
cd wazassist-ai

# 2. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# 3. Setup database
createdb wazassist_dev
npm run migrate:up

# 4. Start backend server
npm run dev

# 5. In a new terminal, setup frontend
cd ../frontend
npm install
cp .env.example .env
# Edit .env with API URL

# 6. Start frontend
npm start
```

Your application should now be running:
- Backend: http://localhost:3000
- Frontend: http://localhost:3001

---

## Detailed Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/wazassist-ai.git
cd wazassist-ai
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Environment Configuration
Create `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your development configuration:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
APP_BASE_URL=http://localhost:3000
APP_LOGO_URL=

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wazassist_dev
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_SSL=false

# AWS Configuration (optional for local dev)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# AWS Cognito (optional for local dev)
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
COGNITO_REGION=us-east-1

# WhatsApp Business API
# Get these from https://developers.facebook.com
WHATSAPP_API_TOKEN=your-test-token
WHATSAPP_PHONE_NUMBER_ID=your-test-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=test-verify-token-12345
WHATSAPP_WEBHOOK_SECRET=test-webhook-secret

# OpenAI Configuration
# Get your API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000

# Paystack Configuration (Test Mode)
# Get test keys from https://dashboard.paystack.com/#/settings/developer
PAYSTACK_SECRET_KEY=sk_test_your-test-secret-key
PAYSTACK_PUBLIC_KEY=pk_test_your-test-public-key

# Flutterwave Configuration (Test Mode)
# Get test keys from https://dashboard.flutterwave.com/settings/apis
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your-test-secret-key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your-test-public-key
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST-your-test-encryption-key
FLUTTERWAVE_SECRET_HASH=your-test-secret-hash

# Frontend URL (for payment redirects)
FRONTEND_URL=http://localhost:3001

# Logging
LOG_LEVEL=debug
LOG_TO_FILE=false
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../frontend
npm install
```

#### Environment Configuration
Create `.env` file in the `frontend` directory:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_WS_URL=ws://localhost:3000
REACT_APP_ENV=development
REACT_APP_COGNITO_USER_POOL_ID=
REACT_APP_COGNITO_CLIENT_ID=
REACT_APP_COGNITO_REGION=us-east-1
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your-test-public-key
REACT_APP_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your-test-public-key
```

---

## Database Setup

### 1. Install PostgreSQL

#### macOS (using Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql-14 postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
- Download installer from [PostgreSQL.org](https://www.postgresql.org/download/windows/)
- Run installer and follow prompts
- Remember the password you set for the `postgres` user

### 2. Create Development Database

#### Option 1: Using psql
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE wazassist_dev;

# Create user (optional)
CREATE USER wazassist_dev WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE wazassist_dev TO wazassist_dev;

# Exit psql
\q
```

#### Option 2: Using createdb command
```bash
createdb wazassist_dev
```

### 3. Run Database Migrations

```bash
cd backend
npm run migrate:up
```

This will create all necessary tables:
- users
- businesses
- products
- orders
- order_items
- conversations
- messages
- payment_transactions
- ai_prompts

### 4. Seed Test Data (Optional)

```bash
npm run seed
```

This creates:
- Test business account
- Sample products
- Test customers
- Sample orders

---

## Running the Application

### Development Mode (Recommended)

#### Start Backend
```bash
cd backend
npm run dev
```

The backend will start on http://localhost:3000 with hot-reload enabled.

#### Start Frontend (in a new terminal)
```bash
cd frontend
npm start
```

The frontend will start on http://localhost:3001 and open in your browser.

### Production Build

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm install -g serve
serve -s build -p 3001
```

---

## Development Workflow

### File Structure

```
wazassist-ai/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/          # API route handlers
│   │   │   └── middleware/      # Express middleware
│   │   ├── services/            # Business logic
│   │   ├── config/              # Configuration files
│   │   ├── utils/               # Utility functions
│   │   └── index.js             # Application entry point
│   ├── migrations/              # Database migrations
│   ├── tests/                   # Test files
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service calls
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Utility functions
│   │   └── App.js               # Main app component
│   ├── public/
│   ├── package.json
│   └── .env
│
└── docs/                        # Documentation
```

### Adding New Features

#### 1. Database Changes
```bash
# Create a new migration
cd backend
npm run migrate:create migration-name

# Edit the migration file in migrations/
# Then run:
npm run migrate:up
```

#### 2. Backend API Endpoint

Create a new route file:
```javascript
// backend/src/api/routes/feature.routes.js
import express from 'express';
import featureService from '../../services/feature.service.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const data = await featureService.getData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

Create service logic:
```javascript
// backend/src/services/feature.service.js
import { query } from '../config/database.js';

export async function getData() {
  const result = await query('SELECT * FROM table_name');
  return result.rows;
}

export default { getData };
```

Register route:
```javascript
// backend/src/api/routes/index.js
import featureRoutes from './feature.routes.js';

router.use('/feature', featureRoutes);
```

#### 3. Frontend Component

Create component:
```javascript
// frontend/src/components/FeatureComponent.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

function FeatureComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get('/feature')
      .then(response => setData(response.data.data))
      .catch(error => console.error(error));
  }, []);

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}

export default FeatureComponent;
```

### Code Style and Linting

#### Run ESLint
```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

#### Format Code with Prettier
```bash
npm run format
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "Add feature description"

# Push to remote
git push origin feature/feature-name

# Create pull request on GitHub
```

---

## Testing

### Backend Testing

#### Unit Tests
```bash
cd backend
npm test
```

#### Test Specific Feature
```bash
npm test -- --grep "Product Service"
```

#### Test Coverage
```bash
npm run test:coverage
```

### API Testing Scripts

Test product endpoints:
```bash
cd backend
node tests/test-products.js
```

Test order endpoints:
```bash
node tests/test-orders.js
```

Test payment endpoints:
```bash
node tests/test-payments.js
```

### Manual API Testing

#### Using curl

Test health endpoint:
```bash
curl http://localhost:3000/health
```

Test API info:
```bash
curl http://localhost:3000/api/v1
```

Create a product:
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "business-uuid",
    "name": "Test Product",
    "description": "Test description",
    "price": 10000,
    "category": "Electronics",
    "quantityInStock": 50
  }'
```

#### Using Postman/Thunder Client

1. Import the API collection from `docs/postman-collection.json`
2. Set environment variables:
   - `base_url`: http://localhost:3000/api/v1
3. Run requests

### Frontend Testing

```bash
cd frontend
npm test
```

Run in watch mode:
```bash
npm test -- --watch
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find and kill process using port 3000
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### 2. Database Connection Failed

**Error:** `ECONNREFUSED` or `password authentication failed`

**Solutions:**
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env` match your PostgreSQL setup
- Verify database exists: `psql -l`
- Check PostgreSQL logs: `/var/log/postgresql/` (Linux) or Console.app (macOS)

#### 3. Migration Errors

**Error:** `relation "table_name" already exists`

**Solution:**
```bash
# Drop and recreate database
dropdb wazassist_dev
createdb wazassist_dev
npm run migrate:up
```

#### 4. WhatsApp Webhook Testing

**Issue:** Can't test webhooks on localhost

**Solution:** Use ngrok to expose local server:
```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Start ngrok
ngrok http 3000

# Use the ngrok URL in WhatsApp webhook configuration
# Example: https://abc123.ngrok.io/api/v1/webhooks/whatsapp
```

#### 5. Payment Gateway Test Mode

**Issue:** Payments not working in development

**Solution:**
- Ensure you're using TEST keys (starting with `sk_test_` or `FLWSECK_TEST`)
- Use test card numbers:
  - Paystack: 4084084084084081
  - Flutterwave: 5531886652142950

#### 6. CORS Errors

**Error:** `Access-Control-Allow-Origin` error

**Solution:**
- Backend already has CORS configured for localhost:3001
- If using different port, update CORS config in `backend/src/index.js`

#### 7. Environment Variables Not Loading

**Issue:** Application doesn't read .env file

**Solution:**
- Verify `.env` file exists in the correct directory
- Check file has no spaces around `=` signs
- Restart the development server
- Check for syntax errors in .env file

#### 8. Module Not Found Errors

**Error:** `Cannot find module 'module-name'`

**Solution:**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 9. Database Migration Failed

**Error:** Migration fails midway

**Solution:**
```bash
# Rollback failed migration
npm run migrate:down

# Check migration file for errors
# Fix and run again
npm run migrate:up
```

### Checking Application Status

#### Backend Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "operational",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "database": "connected",
  "uptime": 1234.56
}
```

#### Database Connection Test
```bash
psql -U postgres -d wazassist_dev -c "SELECT COUNT(*) FROM products;"
```

#### View Application Logs

Backend logs (if LOG_TO_FILE=true):
```bash
tail -f backend/logs/app.log
```

Console logs:
- Backend logs appear in terminal where you ran `npm run dev`
- Frontend logs appear in browser console (F12)

---

## Useful Commands

### Database

```bash
# Connect to database
psql -U postgres -d wazassist_dev

# List tables
\dt

# Describe table
\d table_name

# Run SQL file
psql -U postgres -d wazassist_dev -f script.sql

# Backup database
pg_dump wazassist_dev > backup.sql

# Restore database
psql -U postgres -d wazassist_dev < backup.sql
```

### Git

```bash
# View status
git status

# View changes
git diff

# Create branch
git checkout -b feature/new-feature

# Switch branch
git checkout main

# Pull latest changes
git pull origin main

# Stash changes
git stash
git stash pop
```

### npm

```bash
# Install new package
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Update packages
npm update

# Check outdated packages
npm outdated

# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

After completing setup:

1. **Explore the API**: Review `docs/API_DOCUMENTATION.md`
2. **Run test scripts**: Execute test files in `backend/tests/`
3. **Build a feature**: Follow the development workflow above
4. **Read deployment guide**: See `docs/DEPLOYMENT.md` when ready to deploy

## Getting Help

- **Documentation**: Check `docs/` folder
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions
- **Email Support**: dev@wazassist.com

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Please read `CONTRIBUTING.md` for details on our code of conduct and development process.

---

Happy coding!
