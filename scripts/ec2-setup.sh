#!/usr/bin/env bash
# =============================================================================
# ec2-setup.sh — Run ONCE on a fresh Amazon Linux 2023 EC2 instance
# Usage:  chmod +x ec2-setup.sh && ./ec2-setup.sh
# =============================================================================
set -euo pipefail

echo "==> [1/6] Updating system packages"
sudo dnf update -y

echo "==> [2/6] Installing Node.js 20"
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

echo "==> [3/6] Installing PM2"
sudo npm install -g pm2

echo "==> [4/6] Installing Nginx"
sudo dnf install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

echo "==> [5/6] Installing Git"
sudo dnf install -y git

echo "==> [6/6] Creating log directory"
mkdir -p /home/ec2-user/logs

echo ""
echo "✅  EC2 setup complete."
echo "    Node: $(node -v)"
echo "    NPM:  $(npm -v)"
echo "    PM2:  $(pm2 -v)"
echo ""
echo "Next steps:"
echo "  1. git clone <your-repo> /home/ec2-user/tnp"
echo "  2. cp /home/ec2-user/tnp/backend/.env.example /home/ec2-user/tnp/backend/.env"
echo "  3. Edit .env with real values"
echo "  4. sudo cp /home/ec2-user/tnp/nginx/tnp.conf /etc/nginx/conf.d/tnp.conf"
echo "  5. sudo nginx -t && sudo systemctl reload nginx"
echo "  6. cd /home/ec2-user/tnp/backend && npm install --omit=dev"
echo "  7. npm run migrate"
echo "  8. pm2 start ecosystem.config.js"
echo "  9. pm2 startup  # run the generated command"
echo " 10. pm2 save"
