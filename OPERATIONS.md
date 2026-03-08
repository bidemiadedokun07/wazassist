# WazAssist AI - Operations Runbook

## Table of Contents
1. [Daily Operations](#daily-operations)
2. [Monitoring Dashboard](#monitoring-dashboard)
3. [Incident Response](#incident-response)
4. [Common Operations](#common-operations)
5. [Scaling Guide](#scaling-guide)
6. [Backup & Recovery Procedures](#backup--recovery-procedures)
7. [Security Operations](#security-operations)
8. [Performance Tuning](#performance-tuning)

---

## Daily Operations

### Morning Checklist
```bash
# 1. Check application health
curl https://api.wazassist.com/health

# 2. Check detailed system health
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.wazassist.com/api/v1/monitoring/health/detailed

# 3. Check performance metrics
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.wazassist.com/api/v1/monitoring/metrics

# 4. Check database statistics
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.wazassist.com/api/v1/monitoring/stats

# 5. Review error logs (last 1 hour)
docker-compose logs --since 1h app | grep -i error
# OR for PM2
pm2 logs --lines 100 --err

# 6. Check disk space
df -h

# 7. Check database size
docker exec wazassist-postgres psql -U wazassist_user -d wazassist_prod -c \
  "SELECT pg_size_pretty(pg_database_size('wazassist_prod'));"
```

### Weekly Checklist
- [ ] Review performance metrics trends
- [ ] Check database backup integrity
- [ ] Review and rotate logs
- [ ] Check SSL certificate expiry
- [ ] Review security logs for suspicious activity
- [ ] Update dependencies (security patches)
- [ ] Review and optimize slow queries

### Monthly Checklist
- [ ] Full system backup
- [ ] Test disaster recovery procedures
- [ ] Review and update documentation
- [ ] Security audit
- [ ] Performance review and optimization
- [ ] Cost optimization review (cloud resources)
- [ ] Review and update monitoring alerts

---

## Monitoring Dashboard

### Key Metrics to Monitor

#### Application Metrics
```bash
# Get performance metrics
curl -H "Authorization: Bearer $TOKEN" \
  https://api.wazassist.com/api/v1/monitoring/metrics

# Key metrics to watch:
# - Average response time: < 500ms (good), < 1000ms (acceptable), > 1000ms (investigate)
# - Error rate: < 1% (good), < 5% (acceptable), > 5% (critical)
# - Request rate: Monitor for unusual spikes
# - Memory usage: < 70% (good), < 85% (warning), > 90% (critical)
```

#### Database Metrics
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 second'
ORDER BY duration DESC;

-- Check database size
SELECT pg_size_pretty(pg_database_size('wazassist_prod'));

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexname NOT LIKE 'pg_%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

#### Redis Metrics
```bash
# Connect to Redis
docker exec -it wazassist-redis redis-cli -a $REDIS_PASSWORD

# Check memory usage
INFO memory

# Check connected clients
INFO clients

# Check keys
INFO keyspace

# Monitor commands in real-time
MONITOR
```

### CloudWatch Alarms (AWS)
```bash
# CPU Utilization > 80% for 5 minutes
aws cloudwatch put-metric-alarm \
  --alarm-name wazassist-high-cpu \
  --alarm-description "CPU utilization is too high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold

# Memory Utilization > 85% for 5 minutes
aws cloudwatch put-metric-alarm \
  --alarm-name wazassist-high-memory \
  --alarm-description "Memory utilization is too high" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold

# Error rate > 5% for 5 minutes
aws cloudwatch put-metric-alarm \
  --alarm-name wazassist-high-errors \
  --alarm-description "Error rate is too high" \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

---

## Incident Response

### Severity Levels

**P0 - Critical**: Complete service outage
- Response time: Immediate
- Escalation: All hands on deck
- Examples: Database down, application not responding

**P1 - High**: Partial service degradation
- Response time: < 15 minutes
- Escalation: On-call engineer
- Examples: High error rate, slow response times

**P2 - Medium**: Non-critical issues
- Response time: < 1 hour
- Escalation: During business hours
- Examples: Single feature not working, minor bugs

**P3 - Low**: Cosmetic issues
- Response time: Next business day
- Escalation: Not required
- Examples: UI glitches, typos

### Incident Response Checklist

1. **Acknowledge**
   - Confirm the incident
   - Assign incident commander
   - Create incident channel (Slack/Discord)

2. **Assess**
   - Determine severity level
   - Identify affected systems
   - Estimate impact (% of users affected)

3. **Communicate**
   - Update status page
   - Notify stakeholders
   - Set update cadence (every 15-30 minutes for P0/P1)

4. **Investigate**
   - Check recent deployments
   - Review error logs
   - Check system metrics
   - Identify root cause

5. **Mitigate**
   - Apply fix or rollback
   - Verify resolution
   - Continue monitoring

6. **Resolve**
   - Update status page
   - Notify stakeholders
   - Document incident

7. **Post-Mortem**
   - Schedule post-mortem meeting (within 48 hours)
   - Document timeline, root cause, and action items
   - Implement preventive measures

### Common Incident Scenarios

#### Application Not Responding

```bash
# 1. Check if application is running
docker-compose ps
# OR
pm2 status

# 2. Check application logs
docker-compose logs --tail 100 app
# OR
pm2 logs --lines 100

# 3. Check database connectivity
docker exec wazassist-postgres pg_isready -U wazassist_user

# 4. Check Redis connectivity
docker exec wazassist-redis redis-cli -a $REDIS_PASSWORD ping

# 5. Restart application if needed
docker-compose restart app
# OR
pm2 restart wazassist-api

# 6. If still not responding, check system resources
top
df -h
free -h
```

#### High Error Rate

```bash
# 1. Check recent error logs
docker-compose logs --since 30m app | grep -i error | tail -50

# 2. Check performance metrics
curl -H "Authorization: Bearer $TOKEN" \
  https://api.wazassist.com/api/v1/monitoring/metrics

# 3. Check for specific error patterns
docker-compose logs app | grep -E "(500|502|503|504)" | tail -20

# 4. Check database for slow queries
# (See Database Metrics section above)

# 5. Check for external service issues
# - WhatsApp API status
# - AWS Bedrock status
# - Payment gateway status

# 6. If caused by recent deployment, rollback
docker-compose down
git checkout <previous-commit>
docker-compose up -d
```

#### Database Connection Pool Exhausted

```sql
-- 1. Check active connections
SELECT count(*) FROM pg_stat_activity;

-- 2. Check connection details
SELECT pid, usename, application_name, client_addr, state, query_start
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY query_start;

-- 3. Kill idle connections (if necessary)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < NOW() - INTERVAL '30 minutes';

-- 4. Increase pool size in .env.production
DATABASE_POOL_MAX=30  # Increase from 20
```

#### Out of Disk Space

```bash
# 1. Check disk usage
df -h

# 2. Find largest directories
du -sh /* | sort -rh | head -10

# 3. Clean up Docker (if using Docker)
docker system prune -a --volumes

# 4. Rotate and compress logs
find /var/log -type f -name "*.log" -mtime +7 -exec gzip {} \;

# 5. Clean up old database backups
find /backups -type f -name "*.sql" -mtime +30 -delete

# 6. If PostgreSQL data is large, vacuum database
docker exec wazassist-postgres psql -U wazassist_user -d wazassist_prod -c "VACUUM FULL ANALYZE;"
```

---

## Common Operations

### Deploying Updates

```bash
# 1. Backup database before deployment
pg_dump -h localhost -U wazassist_user -d wazassist_prod -F c -f backup_pre_deploy_$(date +%Y%m%d_%H%M%S).dump

# 2. Pull latest code
git pull origin main

# 3. Update dependencies
npm install
cd frontend && npm install && cd ..

# 4. Run database migrations
curl -X POST http://localhost:3000/api/v1/admin/migrate/<migration-name> \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 5. Build frontend
cd frontend && npm run build && cd ..

# 6. Restart application with zero downtime
# Using Docker Compose
docker-compose up -d --build --no-deps app

# Using PM2
pm2 reload ecosystem.config.js --env production
```

### Rolling Back Deployment

```bash
# 1. Identify previous working commit
git log --oneline -10

# 2. Checkout previous version
git checkout <commit-hash>

# 3. Rollback database migrations (if needed)
# This depends on your migration setup - be cautious!

# 4. Rebuild and restart
docker-compose up -d --build app
# OR
pm2 reload ecosystem.config.js --env production

# 5. Verify rollback was successful
curl https://api.wazassist.com/health
```

### Rotating Secrets

```bash
# 1. Generate new JWT secrets
NEW_JWT_SECRET=$(openssl rand -base64 32)
NEW_REFRESH_SECRET=$(openssl rand -base64 32)

# 2. Update .env.production with new secrets
# Keep old secrets temporarily for grace period

# 3. Restart application
docker-compose restart app

# 4. Monitor for authentication issues

# 5. After grace period (24-48 hours), remove old secrets
```

### Adding New Team Member Access

```bash
# 1. Create PostgreSQL user
docker exec -it wazassist-postgres psql -U wazassist_user -d wazassist_prod
CREATE USER new_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE wazassist_prod TO new_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO new_user;

# 2. Add to application (via API or database)
curl -X POST https://api.wazassist.com/api/v1/team/business/:businessId/invite \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "role": "manager",
    "permissions": {}
  }'

# 3. Grant AWS access (if needed)
aws iam attach-user-policy \
  --user-name new_user \
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess
```

---

## Scaling Guide

### Vertical Scaling (Increase Resources)

```bash
# Docker Compose - Update docker-compose.prod.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'      # Increase from 1.0
          memory: 4G       # Increase from 2G
        reservations:
          cpus: '1.0'
          memory: 2G

# Apply changes
docker-compose up -d

# AWS ECS - Update task definition
aws ecs update-service \
  --cluster wazassist-cluster \
  --service wazassist-backend \
  --task-definition wazassist-backend:latest \
  --desired-count 2
```

### Horizontal Scaling (Add More Instances)

```bash
# Using PM2
pm2 scale wazassist-api +2  # Add 2 more instances

# Using Docker Compose
docker-compose up -d --scale app=3

# Using AWS ECS
aws ecs update-service \
  --cluster wazassist-cluster \
  --service wazassist-backend \
  --desired-count 5
```

### Database Scaling

```sql
-- Enable connection pooling with PgBouncer
# Install PgBouncer
sudo apt-get install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
wazassist_prod = host=localhost port=5432 dbname=wazassist_prod

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20

# Update DATABASE_PORT in .env.production
DATABASE_PORT=6432
```

### Redis Scaling

```bash
# Enable Redis Cluster mode
# Update docker-compose.prod.yml
redis:
  image: redis:7-alpine
  command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000

# Or use AWS ElastiCache for Redis
# Update REDIS_HOST in .env.production
REDIS_HOST=your-elasticache-cluster.cache.amazonaws.com
```

---

## Backup & Recovery Procedures

### Database Backup

```bash
# Daily automated backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="wazassist_prod_$DATE.dump"

# Create backup
docker exec wazassist-postgres pg_dump -U wazassist_user -d wazassist_prod -F c -f /tmp/$FILENAME

# Copy from container
docker cp wazassist-postgres:/tmp/$FILENAME $BACKUP_DIR/

# Compress backup
gzip $BACKUP_DIR/$FILENAME

# Upload to S3 (if using AWS)
aws s3 cp $BACKUP_DIR/${FILENAME}.gz s3://wazassist-backups/postgres/

# Delete local backup older than 7 days
find $BACKUP_DIR -type f -name "*.gz" -mtime +7 -delete

# Delete S3 backup older than 30 days (use lifecycle policy)
```

### Database Restore

```bash
# 1. Stop application
docker-compose stop app

# 2. Download backup from S3 (if applicable)
aws s3 cp s3://wazassist-backups/postgres/wazassist_prod_20250130_120000.dump.gz .
gunzip wazassist_prod_20250130_120000.dump.gz

# 3. Drop existing database (CAUTION!)
docker exec wazassist-postgres psql -U wazassist_user -d postgres -c "DROP DATABASE wazassist_prod;"
docker exec wazassist-postgres psql -U wazassist_user -d postgres -c "CREATE DATABASE wazassist_prod;"

# 4. Restore backup
docker cp wazassist_prod_20250130_120000.dump wazassist-postgres:/tmp/
docker exec wazassist-postgres pg_restore -U wazassist_user -d wazassist_prod -c /tmp/wazassist_prod_20250130_120000.dump

# 5. Start application
docker-compose start app

# 6. Verify restore
curl https://api.wazassist.com/health
```

### Point-in-Time Recovery (AWS RDS)

```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier wazassist-prod \
  --target-db-instance-identifier wazassist-prod-restored \
  --restore-time 2025-01-30T12:00:00Z

# Update DATABASE_HOST to new instance
DATABASE_HOST=wazassist-prod-restored.xxxxx.eu-west-1.rds.amazonaws.com
```

---

## Security Operations

### SSL Certificate Renewal

```bash
# Using Let's Encrypt with Certbot
# Auto-renewal is configured, but manual renewal:
sudo certbot renew

# Check certificate expiry
echo | openssl s_client -servername api.wazassist.com -connect api.wazassist.com:443 2>/dev/null | openssl x509 -noout -dates

# Reload Nginx after renewal
docker-compose restart nginx
```

### Security Audit

```bash
# 1. Check for vulnerable dependencies
cd backend && npm audit
cd ../frontend && npm audit

# 2. Fix vulnerabilities
npm audit fix
npm audit fix --force  # Use with caution

# 3. Check Docker image vulnerabilities
docker scan wazassist-app:latest

# 4. Review security logs
docker-compose logs app | grep -i "suspicious"

# 5. Check for unauthorized access attempts
docker-compose logs app | grep -E "(401|403)" | tail -50
```

### Rotating Database Password

```sql
-- 1. Create new password
ALTER USER wazassist_user WITH PASSWORD 'new_secure_password';

-- 2. Update .env.production
DATABASE_PASSWORD=new_secure_password

-- 3. Restart application
docker-compose restart app

-- 4. Test connectivity
psql -h localhost -U wazassist_user -d wazassist_prod -c "SELECT 1;"
```

---

## Performance Tuning

### Optimize Database

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM orders WHERE business_id = 'xxx' AND status = 'pending';

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_orders_business_status ON orders(business_id, status);
CREATE INDEX CONCURRENTLY idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX CONCURRENTLY idx_products_business_active ON products(business_id) WHERE active = true;

-- Update statistics
ANALYZE orders;
ANALYZE conversations;
ANALYZE products;

-- Vacuum and analyze
VACUUM ANALYZE orders;
VACUUM ANALYZE conversations;
```

### Optimize Redis

```bash
# Check slow log
redis-cli -a $REDIS_PASSWORD SLOWLOG GET 10

# Configure memory policy
redis-cli -a $REDIS_PASSWORD CONFIG SET maxmemory-policy allkeys-lru

# Set appropriate TTL for cached data
redis-cli -a $REDIS_PASSWORD CONFIG SET maxmemory 512mb
```

### Application Optimization

```javascript
// Enable response compression in backend/src/index.js
import compression from 'compression';
app.use(compression());

// Implement caching for frequently accessed data
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Add cache middleware
function cacheMiddleware(duration) {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    next();
  };
}
```

---

## Emergency Contacts

- **On-Call Engineer**: [Phone/Slack]
- **Database Admin**: [Phone/Email]
- **Security Team**: [Email/Slack]
- **AWS Support**: [Support Plan Details]
- **Third-Party Services**:
  - WhatsApp Support: [Contact]
  - Payment Gateway Support: [Contact]

---

## Additional Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Security Best Practices](./SECURITY.md)

---

**Last Updated**: 2025-01-30
**Version**: 1.0.0
