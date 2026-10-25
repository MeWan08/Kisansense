#!/bin/bash
# =============================================================================
# KisanSense EC2 Instance Setup Script
# Run this ONCE on a fresh Amazon Linux 2023 / AL2 EC2 instance.
# Usage: ssh ec2-user@<IP> 'bash -s' < scripts/ec2-setup.sh
# =============================================================================
set -euo pipefail

echo "🚀 KisanSense EC2 Setup"
echo "========================"

# 1. Update system
echo "📦 Updating packages..."
sudo dnf update -y

# 2. Install Docker
echo "🐳 Installing Docker..."
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# 3. Install Docker Compose plugin
echo "📋 Installing Docker Compose..."
COMPOSE_VERSION="v2.32.4"
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-$(uname -m)" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 4. Install AWS CLI (for ECR login)
echo "☁️ Installing AWS CLI..."
if ! command -v aws &> /dev/null; then
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
  unzip -q awscliv2.zip
  sudo ./aws/install
  rm -rf aws awscliv2.zip
fi

# 5. Create app directory
echo "📁 Creating app directory..."
mkdir -p /home/ec2-user/kisansense/monitoring

# 6. Verify everything
echo ""
echo "✅ Setup complete!"
echo "==================="
docker --version
docker compose version
aws --version
echo ""
echo "⚠️  Log out and back in for docker group to take effect:"
echo "   exit"
echo "   ssh ec2-user@<IP>"
