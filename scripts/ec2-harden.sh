#!/usr/bin/env bash
set -euo pipefail

sudo dnf install -y nginx >/dev/null
sudo cp /home/ec2-user/wazassist-nginx.conf /etc/nginx/conf.d/wazassist.conf
sudo nginx -t
sudo systemctl enable --now nginx

cd /home/ec2-user/wazassist
pm2 save >/dev/null || true
sudo env PATH="$PATH:/usr/bin" /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user >/dev/null || true

pm2 status
sudo systemctl status nginx --no-pager -n 10
