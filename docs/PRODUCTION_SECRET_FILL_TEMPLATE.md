# Production Secret Fill Template

Use this to complete all remaining `.env.production` values that cannot be auto-generated.

## 1) Values already generated
These are already set in `.env.production`:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_SECRET`
- `WHATSAPP_VERIFY_TOKEN`
- `PAYSTACK_WEBHOOK_SECRET`
- `FLUTTERWAVE_WEBHOOK_SECRET_HASH`

## 2) Values you still need to fetch manually

### OpenAI
- `OPENAI_API_KEY`
- Get from: OpenAI Dashboard -> API keys
- Format: starts with `sk-...`

### Meta WhatsApp Cloud API
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_ACCESS_TOKEN`
- Get from: Meta for Developers -> Your App -> WhatsApp -> API Setup
- Note: `WHATSAPP_VERIFY_TOKEN` in your env must exactly match the token configured in Meta webhook settings.

### Paystack
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- Get from: Paystack Dashboard -> Settings -> API Keys & Webhooks
- Set webhook secret in dashboard to match `.env.production` `PAYSTACK_WEBHOOK_SECRET`.

### Flutterwave
- `FLUTTERWAVE_SECRET_KEY`
- `FLUTTERWAVE_PUBLIC_KEY`
- `FLUTTERWAVE_ENCRYPTION_KEY`
- Get from: Flutterwave Dashboard -> Settings -> API
- Set webhook hash in dashboard to match `.env.production` `FLUTTERWAVE_WEBHOOK_SECRET_HASH`.

### Sentry (optional)
- `SENTRY_DSN`
- Get from: Sentry -> Project Settings -> Client Keys (DSN)

### SMTP / Email (AWS SES recommended)
- `SMTP_USER`
- `SMTP_PASSWORD`
- Get from: AWS SES -> SMTP settings -> Create SMTP credentials
- Host/port are already set (`email-smtp.eu-west-1.amazonaws.com:587`) and should match your SES region.

## 3) AWS credentials guidance (important)
On EC2, use IAM role credentials (already attached) instead of static keys.
Keep these empty in `.env.production`:
- `AWS_ACCESS_KEY_ID=`
- `AWS_SECRET_ACCESS_KEY=`

## 4) Copy/paste fill block
Replace placeholders with real values:

```dotenv
OPENAI_API_KEY=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_ENCRYPTION_KEY=
SENTRY_DSN=
SMTP_USER=
SMTP_PASSWORD=
```

## 5) Apply to server and restart
After filling `.env.production`, deploy and restart app env:

```bash
# from local machine
scp -i /tmp/wazassist-ec2-key .env.production ec2-user@44.199.248.207:/home/ec2-user/wazassist/.env.production
ssh -i /tmp/wazassist-ec2-key ec2-user@44.199.248.207 'cd /home/ec2-user/wazassist && pm2 restart wazassist-api --update-env && pm2 status'
```

## 6) Verify after update

```bash
curl -sS https://api.wazassist.com/health
curl -sS https://api.wazassist.com/ready
curl -sS -o /tmp/login.json -w '%{http_code}\n' -H 'Content-Type: application/json' -d '{"phoneNumber":"+15555555555","password":"wrongpass"}' https://api.wazassist.com/api/v1/auth/login
```

Expected:
- Health = healthy
- Ready = ready
- Login with wrong creds = `401` (controlled failure)

## 7) Optional hardening next
- Move all secrets to AWS Secrets Manager and load at boot.
- Rotate generated secrets after first testing round.
