# Deployment Guide - EduPlatform

Complete deployment instructions for staging and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Ansible Deployment](#ansible-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Ubuntu 20.04 LTS** or later (for server deployments)
- **4GB RAM minimum** (8GB recommended for production)
- **20GB disk space minimum** (100GB recommended for production)
- **Docker 24+** and **Docker Compose 2+**
- **Git** for version control

### Development Tools

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Java 21
sudo apt-get install -y openjdk-21-jdk

# Install Maven
sudo apt-get install -y maven

# Install PostgreSQL client tools
sudo apt-get install -y postgresql-client

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
```

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/eduplatform/app.git
cd Senior-Architect
```

### 2. Install Node Dependencies

```bash
npm install
```

### 3. Set Up Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with your values
nano .env

# Key variables to update:
# - DATABASE_URL (PostgreSQL connection)
# - SENDGRID_API_KEY (email service)
# - SESSION_SECRET
# - JWT_SECRET
```

### 4. Set Up Database

```bash
# Create database
createdb eduplatform_db

# Load schema
psql eduplatform_db < database/schema.sql

# Load sample data (optional)
psql eduplatform_db < database/seed.sql
```

### 5. Build Backend

```bash
cd backend
mvn clean package -DskipTests
cd ..
```

### 6. Run Development Server

```bash
# Start everything with orchestrator
npm run dev

# Or run services separately:

# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend
npm run dev:frontend

# Frontend runs at http://localhost:5173
# Backend runs at http://localhost:8080
# API proxy configured in vite.config.ts
```

### 7. Test Application

```bash
# Type checking
npm run check

# Build production
npm run build

# Test production build
npm start
```

## Staging Deployment

### 1. Server Preparation

```bash
# SSH into staging server
ssh deploy@staging.eduplatform.com

# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker and dependencies
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt-get install -y git
```

### 2. Clone Repository

```bash
cd /home/deploy
git clone https://github.com/eduplatform/app.git eduplatform
cd eduplatform
```

### 3. Configure Environment

```bash
# Copy and edit environment for staging
cp .env.example .env

# Update for staging environment
nano .env

# Key staging variables:
DATABASE_URL=postgresql://user:password@db.staging.eduplatform.com:5432/eduplatform_db
ENVIRONMENT=staging
SENDGRID_API_KEY=<staging-api-key>
VITE_API_URL=https://api-staging.eduplatform.com/api
```

### 4. Deploy with Docker Compose

```bash
# Build and start services
docker-compose -f docker-compose.yml \
  -f docker-compose.staging.yml \
  up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 5. Set Up Reverse Proxy (Nginx)

```bash
# Create Nginx config for staging
sudo cat > /etc/nginx/sites-available/eduplatform-staging << 'EOF'
server {
    listen 80;
    server_name api-staging.eduplatform.com;
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name staging.eduplatform.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/eduplatform-staging /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 6. Set Up SSL Certificates

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificates
sudo certbot certonly --nginx \
  -d staging.eduplatform.com \
  -d api-staging.eduplatform.com \
  --non-interactive \
  --agree-tos \
  -m admin@eduplatform.com

# Auto-renew certificates
sudo systemctl enable certbot.timer
```

## Production Deployment

### 1. Infrastructure Setup

```bash
# Use Terraform for IaC (optional)
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 2. Production Environment

```bash
# SSH into production server
ssh deploy@eduplatform.com

# Same initial setup as staging
# ... (repeat server preparation steps)
```

### 3. Configure for Production

```bash
# Production .env variables
DATABASE_URL=postgresql://produser:securepass@prod-db.internal:5432/eduplatform_prod
ENVIRONMENT=production
NODE_ENV=production

# Enable monitoring and analytics
ENABLE_METRICS=true
LOG_LEVEL=info

# Stronger security settings
MIN_PASSWORD_LENGTH=12
SESSION_TIMEOUT=1800000
RATE_LIMIT_REQUESTS_PER_MINUTE=30
```

### 4. Deploy Production

```bash
cd /home/deploy/eduplatform

# Pull latest code
git fetch origin
git checkout main
git pull origin main

# Build images
docker-compose build --no-cache

# Run migrations
docker-compose run backend sh -c \
  "java -cp app.jar \
   org.springframework.boot.loader.JarLauncher \
   --spring.jpa.hibernate.ddl-auto=validate"

# Deploy stack
docker-compose -f docker-compose.yml \
  -f docker-compose.production.yml \
  up -d

# Verify deployment
docker-compose ps
docker-compose logs -f
```

### 5. Production Nginx Config

```bash
sudo cat > /etc/nginx/sites-available/eduplatform << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;

# Upstream backend
upstream backend {
    # Use at least 2 instances for high availability
    server localhost:8080 weight=5;
    server localhost:8081 weight=5;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name eduplatform.com www.eduplatform.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name eduplatform.com www.eduplatform.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/eduplatform.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eduplatform.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Performance optimization
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;
    gzip_min_length 1000;
    gzip_comp_level 6;

    client_max_body_size 20M;
    keepalive_timeout 75s;

    # Rate limiting
    limit_req zone=general burst=20 nodelay;

    # API proxy
    location /api/ {
        limit_req zone=general burst=50 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_buffering off;
    }

    # WebSocket
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
        proxy_connect_timeout 3600s;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/eduplatform /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

## Docker Deployment

### Build Local Docker Images

```bash
# Build frontend
docker build -t eduplatform/frontend:latest .

# Build backend (Maven build inside Docker)
docker build -t eduplatform/backend:latest ./backend

# Tag for registry
docker tag eduplatform/frontend:latest myregistry.azurecr.io/eduplatform/frontend:latest
docker tag eduplatform/backend:latest myregistry.azurecr.io/eduplatform/backend:latest

# Push to registry
docker push myregistry.azurecr.io/eduplatform/frontend:latest
docker push myregistry.azurecr.io/eduplatform/backend:latest
```

### Docker Compose Commands

```bash
# Start services (development)
docker-compose up -d

# Start services (production)
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute command in container
docker-compose exec backend sh

# Run database migrations
docker-compose exec backend java -cp app.jar \
  org.springframework.boot.loader.JarLauncher \
  --spring.jpa.hibernate.ddl-auto=migrate

# Stop services
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Ansible Deployment

### Set Up Ansible Control Node

```bash
# Install Ansible
pip install ansible ansible-core

# Create inventory file
mkdir -p ansible
cat > ansible/inventory.ini << 'EOF'
[staging]
staging-1 ansible_host=10.0.1.100 ansible_user=deploy

[production]
prod-1 ansible_host=10.1.1.100 ansible_user=deploy
prod-2 ansible_host=10.1.1.101 ansible_user=deploy
prod-3 ansible_host=10.1.1.102 ansible_user=deploy

[all:vars]
ansible_ssh_private_key_file=~/.ssh/id_ed25519
ansible_python_interpreter=/usr/bin/python3
EOF

# Create SSH key
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519

# Copy SSH key to servers
for server in staging-1 prod-1 prod-2 prod-3; do
  ansible $server -i ansible/inventory.ini -m authorized_key \
    -a "user=deploy state=present key='{{ lookup(\"file\", \"~/.ssh/id_ed25519.pub\") }}'"
done
```

### Run Ansible Playbooks

```bash
# Dry run
ansible-playbook ansible/playbook.yml -i ansible/inventory.ini --check

# Deploy to staging
ansible-playbook ansible/playbook.yml -i ansible/inventory.ini \
  -l staging -v

# Deploy to production
ansible-playbook ansible/playbook.yml -i ansible/inventory.ini \
  -l production -v

# Specific tags
ansible-playbook ansible/playbook.yml -i ansible/inventory.ini \
  -t docker,deploy -v

# Rollback
ansible-playbook ansible/rollback.yml -i ansible/inventory.ini \
  -l production -v
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy EduPlatform

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Set up Java
        uses: actions/setup-java@v3
        with:
          java-version: 21
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.m2
          key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run check
      
      - name: Build
        run: npm run build
      
      - name: Build Docker images
        run: |
          docker build -t eduplatform/frontend:${{ github.sha }} .
          docker build -t eduplatform/backend:${{ github.sha }} ./backend
      
      - name: Push to registry
        run: |
          docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
          docker push eduplatform/frontend:${{ github.sha }}
          docker push eduplatform/backend:${{ github.sha }}
      
      - name: Deploy
        run: |
          ssh deploy@staging.eduplatform.com << 'EOF'
          cd /home/deploy/eduplatform
          docker-compose pull
          docker-compose up -d
          EOF
```

## Monitoring & Maintenance

### Application Monitoring

```bash
# Check application health
curl https://eduplatform.com/health

# View logs
docker-compose logs -f

# Check resource usage
docker stats

# Database backups
docker-compose exec postgres pg_dump eduplatform_db > backup.sql

# Database restore
docker-compose exec -T postgres psql eduplatform_db < backup.sql
```

### Security Scanning

```bash
# Container security scan
trivy image eduplatform/frontend:latest
trivy image eduplatform/backend:latest

# Dependency check
npm audit
cd backend && mvn dependency-check:check
```

### Automated Backups

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/backups
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# Database backup
docker-compose exec -T postgres pg_dump eduplatform_db | \
  gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Application data backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz ./uploads

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
EOF

# Run daily at 2 AM
echo "0 2 * * * /home/deploy/eduplatform/backup.sh" | crontab -
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed troubleshooting guide.
