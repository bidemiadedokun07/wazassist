# WazAssist AI - Production Setup Checklist

Use this checklist to ensure you have all required components set up correctly.

## Pre-Deployment Checklist

### 1. Database Setup ✓
- [ ] PostgreSQL 16 instance created
- [ ] Database `wazassist_prod` created
- [ ] Application user `wazassist_user` created with proper permissions
- [ ] UUID extension enabled (`uuid-ossp`)
- [ ] Security group/firewall configured
- [ ] Connection tested successfully
- [ ] Have DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD

### 2. Redis Cache Setup ✓
- [ ] Redis 7 instance created
- [ ] Password/auth token configured
- [ ] Connection tested successfully
- [ ] Have REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

### 3. JWT Secrets Generated ✓
- [ ] JWT_SECRET generated (64 characters)
- [ ] JWT_REFRESH_SECRET generated (64 characters)
- [ ] SESSION_SECRET generated (64 characters)
- [ ] Secrets stored securely (not committed to git)

### 4. AWS Configuration ✓
- [ ] AWS account created
- [ ] IAM user created with programmatic access
- [ ] S3 buckets created:
  - [ ] wazassist-production-uploads
  - [ ] wazassist-production-media
- [ ] S3 bucket policies configured
- [ ] S3 CORS configured
- [ ] Bedrock access requested and approved
- [ ] Have AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION

### 5. WhatsApp Business API ✓
- [ ] Meta Developer account created
- [ ] WhatsApp Business app created
- [ ] Phone number added (test or production)
- [ ] Permanent access token generated
- [ ] Webhook verify token generated
- [ ] Webhook URL configured in Meta dashboard
- [ ] Webhook subscribed to events
- [ ] Have WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_VERIFY_TOKEN

### 6. Payment Gateways ✓

**Paystack:**
- [ ] Business account created
- [ ] KYC verification completed (for live mode)
- [ ] Live API keys obtained
- [ ] Webhook configured
- [ ] Have PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY, PAYSTACK_WEBHOOK_SECRET

**Flutterwave:**
- [ ] Business account created
- [ ] Verification completed
- [ ] Live API keys obtained
- [ ] Webhook configured
- [ ] Have FLUTTERWAVE_SECRET_KEY, FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_ENCRYPTION_KEY

### 7. Environment Configuration ✓
- [ ] .env.production file created (copied from .env.production.example)
- [ ] All required variables filled in
- [ ] File permissions set to 600 (chmod 600 .env.production)
- [ ] File added to .gitignore
- [ ] Backup copy stored securely

### 8. SSL/TLS Certificates ✓
- [ ] Domain purchased and configured
- [ ] DNS A record pointing to server
- [ ] SSL certificate obtained (Let's Encrypt or purchased)
- [ ] Certificate files placed in nginx/ssl/
- [ ] Certificate expiry reminder set (90 days)

### 9. Server Setup ✓
- [ ] Server/VPS provisioned (or AWS ECS/Fargate configured)
- [ ] Docker and Docker Compose installed (if using Docker)
- [ ] Node.js 20.x installed (if using PM2)
- [ ] Nginx installed and configured
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] SSH access secured (key-based auth)

### 10. Application Deployment ✓
- [ ] Code deployed to server
- [ ] Dependencies installed
- [ ] Database migrations run (all 7 migrations)
- [ ] Application started
- [ ] Health check endpoint responding
- [ ] Monitoring endpoints accessible

### 11. Monitoring & Logging ✓
- [ ] CloudWatch configured (if using AWS)
- [ ] Log rotation configured
- [ ] Backup strategy implemented
- [ ] Alerting configured (high CPU, memory, errors)
- [ ] Uptime monitoring set up (UptimeRobot, Pingdom, etc.)

### 12. Security Hardening ✓
- [ ] All security middleware enabled
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Suspicious activity detection enabled
- [ ] Security headers set (via Helmet.js and Nginx)
- [ ] Database SSL/TLS enabled
- [ ] API keys rotated from defaults

### 13. Testing & Verification ✓
- [ ] Health check returns 200 OK
- [ ] Can create user account
- [ ] Can log in successfully
- [ ] Can create business
- [ ] Can add products
- [ ] Can receive WhatsApp webhooks
- [ ] Can process payments (test mode)
- [ ] All API endpoints responding
- [ ] Frontend loads correctly
- [ ] No console errors in browser

### 14. Documentation ✓
- [ ] Team has access to all documentation
- [ ] Emergency contacts documented
- [ ] Rollback procedures documented
- [ ] Disaster recovery plan created
- [ ] API documentation available

### 15. Go-Live Preparation ✓
- [ ] Load testing completed
- [ ] Backup verified and tested
- [ ] Disaster recovery plan tested
- [ ] Team trained on operations
- [ ] Support channels set up
- [ ] Status page created (if applicable)
- [ ] Announcement prepared

---

## Post-Deployment Checklist

### Immediately After Launch
- [ ] Monitor error logs for 1 hour
- [ ] Check all critical user flows
- [ ] Verify webhooks receiving events
- [ ] Monitor database performance
- [ ] Check memory and CPU usage
- [ ] Verify backup job ran successfully

### First 24 Hours
- [ ] Review performance metrics
- [ ] Check for any unusual error patterns
- [ ] Monitor payment transactions
- [ ] Review user feedback
- [ ] Check webhook delivery success rate

### First Week
- [ ] Analyze performance trends
- [ ] Optimize slow queries (if any)
- [ ] Review and adjust rate limits
- [ ] Check backup integrity
- [ ] Plan any necessary optimizations

---

## Environment Variables Quick Reference

```bash
# Required - Application won't start without these
DATABASE_HOST=
DATABASE_PASSWORD=
DATABASE_USER=
JWT_SECRET=
WHATSAPP_ACCESS_TOKEN=

# Recommended - Application will work but with reduced functionality
REDIS_HOST=
REDIS_PASSWORD=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Optional - Enhance functionality
PAYSTACK_SECRET_KEY=
FLUTTERWAVE_SECRET_KEY=
SENTRY_DSN=
CLOUDWATCH_LOG_GROUP=
```

---

## Quick Command Reference

```bash
# Check health
curl https://api.wazassist.com/health

# View logs (Docker)
docker-compose -f docker-compose.prod.yml logs -f app

# View logs (PM2)
pm2 logs wazassist-api

# Restart application (Docker)
docker-compose -f docker-compose.prod.yml restart app

# Restart application (PM2)
pm2 restart wazassist-api

# Check database connection
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT 1;"

# Backup database
pg_dump -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -F c > backup.dump
```

---

## Support Resources

- **Full Setup Guide**: [PRODUCTION_SETUP_GUIDE.md](./PRODUCTION_SETUP_GUIDE.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Operations**: [OPERATIONS.md](./OPERATIONS.md)

---

## Emergency Contacts

- On-Call Engineer: __________________
- Database Admin: __________________
- AWS Support: __________________
- WhatsApp Support: __________________
- Payment Gateway Support: __________________

---

**Last Updated**: 2025-12-30
**Reviewed By**: __________________
**Next Review Date**: __________________
