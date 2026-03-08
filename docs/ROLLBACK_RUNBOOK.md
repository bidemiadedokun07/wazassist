# WazAssist Production Rollback Runbook (EC2)

## Scope
This runbook covers rollback for the production API hosted on EC2 with PM2 + Nginx at `api.wazassist.com`.

## Trigger Conditions
- Health check fails: `https://api.wazassist.com/health`
- Readiness check fails: `https://api.wazassist.com/ready`
- Sustained 5xx spike after deploy
- Critical business flow broken (auth/order/message flow)

## Pre-Checks
1. Confirm issue is production-only and not DNS/client cache.
2. Capture current state:
   - `pm2 status`
   - `pm2 logs wazassist-api --lines 200`
   - `sudo nginx -t`
3. Record deployment timestamp and last known good release/tag.

## Rollback Procedure (Fast Path)
1. Connect to EC2 using SSM Session Manager.
2. Go to app directory:
   - `cd /home/ec2-user/wazassist`
3. Check available rollback points (git tags/commits):
   - `git tag --sort=-creatordate | head`
   - `git log --oneline -n 20`
4. Move to last known good revision:
   - `git checkout <LAST_KNOWN_GOOD_TAG_OR_COMMIT>`
5. Reinstall production deps (if lockfile/package changed):
   - `npm ci --omit=dev`
6. Restart app with env refresh:
   - `pm2 restart wazassist-api --update-env`
7. Validate runtime:
   - `curl -sS https://api.wazassist.com/health`
   - `curl -sS https://api.wazassist.com/ready`

## If Rollback Fails
1. Restart Nginx and PM2:
   - `sudo systemctl restart nginx`
   - `pm2 restart wazassist-api --update-env`
2. If still failing, revert only config files from last known good commit:
   - `.env.production`
   - Nginx config in `/etc/nginx/conf.d/wazassist.conf`
3. Re-run checks and keep system in degraded-safe mode (serve health, disable risky endpoints if needed).

## Database Safety Rules
- Do not run destructive migrations during incident rollback.
- Prefer backward-compatible schema changes in normal releases.
- If schema drift is suspected, stop app writes and restore from RDS backup/snapshot using a separate recovery plan.

## Success Criteria
- `/health` returns `healthy`
- `/ready` returns `ready`
- Key business smoke tests pass
- Error rate returns to baseline

## Post-Incident
1. Document root cause, impact window, and fix.
2. Pin a stable release tag as rollback target.
3. Add missing alarm/action if detection was delayed.
