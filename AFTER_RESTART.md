# After Computer Restart - Quick Start Guide

## Step 1: Start Database (Required)

```bash
cd /Users/bmic/Documents/NEW_AI_APP_Benvisoft/WazAssist_App
docker-compose up -d
```

Wait 10 seconds for PostgreSQL to fully start.

## Step 2: Start Backend Server

```bash
# In first terminal
cd /Users/bmic/Documents/NEW_AI_APP_Benvisoft/WazAssist_App
npm run dev
```

Wait until you see: "🚀 WazAssist AI Server started on port 3000"

## Step 3: Start Frontend Server

```bash
# In second terminal
cd /Users/bmic/Documents/NEW_AI_APP_Benvisoft/WazAssist_App/frontend
npm run dev
```

Wait until you see: "Local: http://localhost:5173/"

## Step 4: Verify Everything Works

```bash
# In third terminal
curl http://localhost:3000/health
```

Should return: `{"status":"healthy",...}`

## That's It!

Your application is now running:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## If You Want to Continue Development

Read **SESSION_STATE.md** to see what was completed and what's next.

## If You Want to Deploy to Production

Follow **PRODUCTION_SETUP_GUIDE.md** step by step to:
1. Set up your production database
2. Get all required environment variables
3. Deploy the application

## Need Help?

- Quick commands: **QUICK_START.md**
- Full deployment: **DEPLOYMENT.md**
- Daily operations: **OPERATIONS.md**
- Setup checklist: **SETUP_CHECKLIST.md**
