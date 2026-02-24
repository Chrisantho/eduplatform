# Quick Start Guide - EduPlatform

Get EduPlatform running in 5 minutes locally or in 15 minutes on a server.

## Local Development (5 minutes)

### Prerequisites
- Node.js 18+
- Java 21+
- PostgreSQL 14+
- Git

### Step 1: Clone & Setup
```bash
git clone https://github.com/eduplatform/app.git
cd Senior-Architect
npm install
```

### Step 2: Configure Database
```bash
# Start PostgreSQL (or use Docker)
docker run --name eduplatform-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=eduplatform_db \
  -p 5432:5432 \
  -d postgres:15

# Create database
createdb -U user -h localhost eduplatform_db

# Load schema
psql -U user -h localhost eduplatform_db < database/schema.sql
```

### Step 3: Set Environment
```bash
cp .env.example .env

# Edit .env with your values
nano .env

# Minimum required:
# DATABASE_URL=postgresql://user:password@localhost:5432/eduplatform_db
```

### Step 4: Start Services
```bash
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- API Docs: http://localhost:8080/swagger-ui.html (if enabled)

### Step 5: Test Login
```bash
# Default accounts (from seed.sql):
# Admin: admin@example.com / password123
# Student: student@example.com / password123
```

## Docker Deployment (10 minutes)

### Step 1: Prepare Environment
```bash
cp .env.example .env
# Edit .env for your deployment
```

### Step 2: Build & Start
```bash
docker-compose up -d --build
```

**Access the application:**
- Frontend: http://localhost
- Backend API: http://localhost/api
- PostgreSQL: localhost:5432

### Step 3: Verify
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Test API
curl http://localhost/api/health
```

## Server Deployment (20 minutes)

### Step 1: Server Setup
```bash
ssh deploy@your-server.com

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install -y docker-compose

# Clone repository
git clone https://github.com/eduplatform/app.git /home/deploy/eduplatform
cd /home/deploy/eduplatform
```

### Step 2: Configure
```bash
cp .env.example .env
nano .env

# Important settings:
# DATABASE_URL=postgresql://produser:securepass@postgres:5432/eduplatform_db
# ENVIRONMENT=production
# SENDGRID_API_KEY=<your-api-key>
# SESSION_SECRET=<strong-random-key>
```

### Step 3: Deploy
```bash
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d --build
```

### Step 4: Setup Nginx Reverse Proxy
```bash
sudo cat > /etc/nginx/sites-available/eduplatform << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        proxy_pass http://localhost;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/eduplatform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Setup SSL
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Common Tasks

### Create Admin User
```bash
# Via SQL
psql eduplatform_db << 'SQL'
INSERT INTO users (username, email, password, full_name, role)
VALUES ('admin', 'admin@example.com', 
  '$2a$12$...', 'Admin User', 'ADMIN');
SQL

# Or use API (register then update role)
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "fullName": "Admin User"
  }'
```

### View Application Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services
```bash
# All
docker-compose restart

# Specific
docker-compose restart backend
```

### Stop Application
```bash
# Stop but keep data
docker-compose stop

# Stop and remove containers (keep volumes)
docker-compose down

# Stop and remove everything (data loss)
docker-compose down -v
```

### Backup Database
```bash
docker-compose exec postgres pg_dump eduplatform_db | gzip > backup.sql.gz
```

### Restore Database
```bash
gunzip < backup.sql.gz | docker-compose exec -T postgres psql eduplatform_db
```

## Troubleshooting Quick Fixes

### Port Already in Use
```bash
# Find what's using port 5173, 8080, 5432
lsof -i :5173
lsof -i :8080
lsof -i :5432

# Kill the process
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

### Database Connection Failed
```bash
# Verify database is running
docker ps | grep postgres

# Start if stopped
docker-compose up -d postgres

# Check connection string
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL" -c "SELECT 1;"
```

### Build Failures
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Application Running but API Not Responding
```bash
# Check backend logs
docker-compose logs backend | tail -50

# Restart backend
docker-compose restart backend

# Test directly
curl -v http://localhost:8080/api/health
```

## Environment Variables Quick Reference

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Email (for notifications)
SENDGRID_API_KEY=SG.xxxxx
ADMIN_EMAIL=admin@example.com

# Frontend
VITE_API_URL=http://localhost:8080/api

# Security
SESSION_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-here

# Deployment
ENVIRONMENT=development|staging|production
NODE_ENV=development|production

# Optional
ENABLE_METRICS=true|false
LOG_LEVEL=info|debug|warn|error
```

## Next Steps

1. **Create first exam** - Go to Admin Dashboard → Create Exam
2. **Add questions** - Add MCQ and Short Answer questions
3. **Assign students** - Add students and assign exams
4. **Monitor results** - View real-time submissions and scores
5. **Configure settings** - Customize password policies, exam settings, etc

## Getting Help

- **Documentation**: See [README.md](./README.md)
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Troubleshooting**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Issues**: https://github.com/eduplatform/issues
- **Email**: support@eduplatform.com

## What's Included

✅ Complete React Frontend with Vite  
✅ Spring Boot Java Backend  
✅ PostgreSQL Database  
✅ Docker & Docker Compose  
✅ Nginx Configuration  
✅ Dark/Light Theme Support  
✅ JWT Authentication  
✅ Role-Based Access Control  
✅ Real-Time WebSocket Support  
✅ Email Notifications  
✅ File Upload Support  
✅ Comprehensive Documentation  

## Production Checklist

Before going live:

- [ ] Update `.env` with production values
- [ ] Set strong `SESSION_SECRET` and `JWT_SECRET`
- [ ] Configure SENDGRID_API_KEY for emails
- [ ] Setup SSL certificates
- [ ] Enable HTTPS only
- [ ] Configure rate limiting
- [ ] Setup database backups
- [ ] Enable monitoring & logging
- [ ] Run security audit
- [ ] Test failover scenarios
- [ ] Setup CI/CD pipeline
- [ ] Configure CDN for static assets

---

**Ready to go?** Start with: `npm run dev`
