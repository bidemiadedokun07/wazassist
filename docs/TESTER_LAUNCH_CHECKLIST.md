# Tester Launch Checklist (Human Feedback Phase)

## Goal
Enable external users to start testing safely, and collect actionable human feedback.

## Current Status Snapshot
- ✅ API DNS resolves: `api.wazassist.com -> 44.199.248.207`
- ✅ HTTPS is active and redirects from HTTP
- ✅ API health and readiness are passing
- ✅ DB and Redis are available
- ✅ CloudWatch alarms are configured and wired to SNS
- ✅ SNS email subscription is confirmed
- ⚠️ Root app domain `wazassist.com` did not resolve in latest check (frontend entry point not confirmed)
- ⚠️ `.env.production` still contains placeholder secrets/keys in multiple integrations

## Must Complete Before Inviting Testers

### 1) Finalize production secrets and integrations
Replace placeholder values in `.env.production` for:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_SECRET`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `PAYSTACK_WEBHOOK_SECRET`
- `FLUTTERWAVE_WEBHOOK_SECRET_HASH`
- `SMTP_USER`
- `SMTP_PASSWORD`
- Any other `your-*` placeholder values

Notes:
- Avoid storing static AWS access keys on EC2 if an IAM role is already attached.
- Restart backend after env updates and re-check `/health` and `/ready`.

### 2) Confirm tester entry URL
Choose one and publish it to testers:
- Frontend URL (preferred): `https://wazassist.com` (or `https://app.wazassist.com`)
- API-only pilot URL: `https://api.wazassist.com`

If frontend is not yet deployed, provide a short API pilot guide instead of a web app URL.

### 3) Run smoke tests on production
Minimum checklist:
- `GET /health` -> healthy
- `GET /ready` -> ready
- `POST /api/v1/auth/login` invalid credentials -> controlled `401`
- One core business flow endpoint returns expected success with test data
- One webhook simulation path (if in scope) is validated

### 4) Prepare tester data and accounts
- Create 5-20 pilot test accounts/personas
- Seed realistic but non-sensitive sample data
- Define reset process for test data between feedback rounds

### 5) Setup feedback capture
- Create one feedback channel (Google Form / Typeform / support email)
- Ask for: scenario tested, expected vs actual, screenshot/log, severity
- Include tester identifier so feedback can be linked to API logs

## Strongly Recommended (Day 1)
- Publish known issues + scope boundaries to testers
- Assign an on-call owner during testing windows
- Review CloudWatch + app logs daily and triage top 3 issues
- Keep rollback command/runbook ready (`docs/ROLLBACK_RUNBOOK.md`)

## Launch Decision Rule
Invite testers when all are true:
- [ ] No placeholder secrets remain in active production env
- [ ] Tester entry URL is reachable publicly
- [ ] Smoke tests pass end-to-end
- [ ] Feedback channel is live and monitored
- [ ] On-call owner is assigned
