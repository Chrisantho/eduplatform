# Troubleshooting Guide - EduPlatform

Common issues and solutions for EduPlatform development and deployment.

## Table of Contents

- [Development Issues](#development-issues)
- [Database Issues](#database-issues)
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Docker Issues](#docker-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)

## Development Issues

### Node Modules Installation Issues

**Problem**: `npm install` fails with permission errors

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Install with verbose output
npm install -v

# If still failing, check Node version
node --version  # Should be 18+
npm --version

# Try with different registry
npm install --registry https://registry.npmjs.org/

# As last resort, remove and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Compilation Errors

**Problem**: `npm run check` fails with type errors

**Solution**:
```bash
# Rebuild TypeScript
npm run check

# Check specific file
npx tsc --noEmit client/src/App.tsx

# Get detailed error info
npx tsc --pretty false | head -50

# Update TypeScript
npm install typescript@latest
```

### Port Already in Use

**Problem**: "Port 5173 already in use"

**Solution**:
```bash
# Linux/Mac: Find and kill process
lsof -i :5173
kill -9 <PID>

# Windows PowerShell
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3000
```

### Environment Variables Not Loading

**Problem**: Environment variables undefined at runtime

**Solution**:
```bash
# Create .env file in root directory
cp .env.example .env

# Verify file exists
ls -la .env

# Check values are set
grep DATABASE_URL .env

# Restart dev server
npm run dev

# For frontend, variables must be prefixed with VITE_
# Example: VITE_API_URL not just API_URL
```

## Database Issues

### PostgreSQL Connection Failed

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Verify connection
psql -U user -h localhost -d postgres

# Check connection string
echo $DATABASE_URL
# Should be: postgresql://user:password@localhost:5432/dbname

# Test from command line
psql "$DATABASE_URL"

# If using Docker
docker-compose up -d postgres
docker-compose exec postgres psql -U eduuser -d edudb
```

### Database Does Not Exist

**Problem**: `FATAL: database "eduplatform_db" does not exist`

**Solution**:
```bash
# Create database
createdb eduplatform_db

# Or via psql
psql -U postgres
CREATE DATABASE eduplatform_db;
\connect eduplatform_db

# Load schema
psql eduplatform_db < database/schema.sql

# Verify tables
psql eduplatform_db -c "\dt"
```

### Schema Migration Issues

**Problem**: Database schema out of sync

**Solution**:
```bash
# Be careful with these commands!

# Option 1: Safe - Backup first
pg_dump eduplatform_db > backup.sql

# Option 2: Drop and recreate (data loss!)
dropdb eduplatform_db
createdb eduplatform_db
psql eduplatform_db < database/schema.sql

# Option 3: Run migrations
cd backend
mvn flyway:info
mvn flyway:migrate

# Check schema version
psql eduplatform_db -c "SELECT * FROM schema_version ORDER BY installed_rank DESC LIMIT 1;"
```

### Connection Pool Exhausted

**Problem**: `java.sql.SQLException: Cannot get a connection`

**Solution**:
```bash
# Check active connections
psql eduplatform_db -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
psql eduplatform_db -c "SELECT pg_terminate_backend(pg_stat_activity.pid) 
  FROM pg_stat_activity WHERE datname = 'eduplatform_db' AND state = 'idle';"

# Restart application to reset pool
docker-compose restart backend

# Check connection pool settings
grep "datasource.hikari" backend/src/main/resources/application.properties
```

## Backend Issues

### Maven Build Failures

**Problem**: `mvn clean package` fails

**Solution**:
```bash
# Clear Maven cache
rm -rf ~/.m2/repository

# Rebuild with debug
mvn clean package -DskipTests -X | tail -100

# Check Java version
java -version  # Must be 21+

# Update Maven dependencies
mvn dependency:resolve

# Check for conflicts
mvn dependency:tree | grep -i "error"
```

### Spring Boot Won't Start

**Problem**: Application fails to start on port 8080

**Solution**:
```bash
# Check logs for errors
docker-compose logs backend | tail -50

# Verify Spring properties
grep -r "server.port" backend/src/main/resources/

# Run with debug logging
export LOGGING_LEVEL_ROOT=DEBUG
mvn spring-boot:run

# Check port availability
netstat -an | grep 8080
lsof -i :8080

# Try manual start
cd backend
java -jar target/eduplatform-backend-1.0.0.jar

# Check database connectivity
curl -i http://localhost:8080/api/health
```

### Authentication Not Working

**Problem**: Login fails, JWT tokens invalid

**Solution**:
```bash
# Check JWT configuration
grep -r "jwt.secret" backend/src/

# Verify password hashing
# Check if BCrypt is configured correctly
grep -r "BCrypt" backend/src/

# Test manual login
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Check token expiration
# Extract token and decode
# JWT structure: header.payload.signature
# Use jwt.io to decode (locally only!)

# Verify token in subsequent request
TOKEN="your_jwt_token"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/user
```

### File Upload Issues

**Problem**: Profile picture upload fails

**Solution**:
```bash
# Check upload directory permission
ls -la uploads/
sudo chmod 755 uploads/

# Verify multipart configuration
grep -r "multipart" backend/src/main/resources/

# Check file size limit
# Default is 5MB, can be increased in application.properties
# spring.servlet.multipart.max-file-size=20MB

# Test file upload
curl -F "file=@test.png" http://localhost:8080/api/user/profile/avatar

# Clear uploaded files
rm -rf uploads/*
```

### CORS Errors

**Problem**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
```bash
# Check CORS configuration
grep -r "CorsConfig\|@CrossOrigin" backend/src/

# Verify allowed origins
# Should include: http://localhost:5173, http://localhost:3000, etc

# Test CORS preflight
curl -i -X OPTIONS http://localhost:8080/api/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"

# Should return 200 with CORS headers
```

## Frontend Issues

### Vite Dev Server Not Starting

**Problem**: `npm run dev:frontend` fails

**Solution**:
```bash
# Check Node version
node --version  # 18+

# Clear Vite cache
rm -rf node_modules/.vite

# Check vite.config.ts
cat vite.config.ts | grep -A5 "export default"

# Start with verbose output
npx vite --host --port 5173 --debug

# Check for port conflicts
lsof -i :5173
```

### API Requests Failing (404/500)

**Problem**: Frontend API calls return errors

**Solution**:
```bash
# Check API proxy configuration in vite.config.ts
grep -A10 "proxy:" vite.config.ts

# Verify backend is running
curl http://localhost:8080/api/health

# Check request headers
# Open DevTools → Network tab
# Look for Authorization header with JWT token

# Test API directly
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/user

# Check CORS settings
curl -i http://localhost:8080/api/login
# Look for Access-Control-Allow-* headers
```

### Theme/Dark Mode Not Working

**Problem**: Dark mode toggle doesn't persist

**Solution**:
```bash
# Check localStorage
# DevTools Console:
localStorage.getItem('theme')
localStorage.getItem('eduplatform-theme')

# Manually set theme
localStorage.setItem('theme', 'dark')
location.reload()

# Check theme-provider component
cat client/src/components/theme-provider.tsx | head -30

# Clear browser cache
# Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
```

### Build Size Too Large

**Problem**: Bundle size > 1MB

**Solution**:
```bash
# Analyze bundle
npm run build
npm install -g source-map-explorer
source-map-explorer dist/public/assets/*.js

# Or use Vite's built-in analyzer
npm install -D rollup-plugin-visualizer

# Split large chunks
# Edit vite.config.ts:
// rollupOptions: {
//   output: {
//     manualChunks: {
//       'vendor': ['react', 'react-dom'],
//       'ui': ['shadcn/ui/...']
//     }
//   }
// }

# Lazy load pages
import { lazy } from 'react'
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'))
```

### WebSocket Connection Issues

**Problem**: Real-time updates not working

**Solution**:
```bash
# Check WebSocket endpoint
# Look for connection attempts in Network → WS
# Should be: ws://localhost:8080/ws or wss:// for HTTPS

# Test WebSocket manually
websocat ws://localhost:8080/ws

# Check backed logs
docker-compose logs backend | grep -i websocket

# Verify authentication
# WebSocket also requires JWT token

# Check firewall isn't blocking WebSocket
# Port 8080 or alternate WebSocket port
```

## Docker Issues

### Container Fails to Start

**Problem**: `docker-compose up` fails

**Solution**:
```bash
# Check Docker daemon
docker ps

# View service logs
docker-compose logs backend
docker-compose logs frontend

# Check resource limits
docker stats

# Rebuild image
docker-compose build --no-cache backend

# Remove dangling images
docker image prune -a

# Check Docker disk space
docker system df
docker system prune -a
```

### Database Container Won't Initialize

**Problem**: `postgres` service fails to start

**Solution**:
```bash
# Check volume permissions
ls -la postgres_data/

# Remove and recreate volume
docker-compose down -v
docker volume rm <volume-name>
docker-compose up -d postgres

# Check PostgreSQL logs
docker-compose logs postgres | tail -50

# Manually initialize
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE eduplatform_db;"
```

### Container Can't Reach Other Container

**Problem**: Backend can't reach PostgreSQL

**Solution**:
```bash
# Verify network
docker network ls
docker network inspect <network-name>

# Check hostname resolution
docker-compose exec backend ping postgres

# Verify connection string in backend
docker-compose exec backend env | grep DATABASE_URL

# Restart all services
docker-compose restart

# Check security groups / firewall
docker exec backend curl -v http://postgres:5432
```

## Deployment Issues

### Application Won't Deploy

**Problem**: Deployment script fails

**Solution**:
```bash
# Check deployment logs
ssh deploy@server.com
tail -100 /var/log/docker/deploy.log
journalctl -u docker -n 50

# Verify permissions
ls -la /home/deploy/eduplatform/
sudo chown -R deploy:deploy /home/deploy/eduplatform

# Check free disk space
df -h

# Verify SSH key auth
ssh-key-scan -H server.com >> ~/.ssh/known_hosts
ssh -v deploy@server.com

# Manual deployment test
ssh deploy@server.com "cd /home/deploy/eduplatform && git pull"
```

### SSL Certificate Issues

**Problem**: HTTPS not working, certificate errors

**Solution**:
```bash
# Check certificate validity
openssl s_client -connect eduplatform.com:443

# Check Certbot
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Check certificate dates
date
sudo certbot certificates | grep "Expiration Date"

# Setup auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl status certbot.timer
```

### Load Balancer Configuration

**Problem**: Load balancer not distributing requests

**Solution**:
```bash
# Check backend health
curl -i http://backend1:8080/actuator/health
curl -i http://backend2:8080/actuator/health

# Verify sticky sessions for WebSocket
# nginx config: upstream backend { least_conn; }

# Check load balancer logs
tail -100 /var/log/nginx/access.log | grep "upstream"

# Test round-robin
for i in {1..10}; do curl -I http://localhost/api/health; done
# Should see distribution across backends
```

## Performance Issues

### Slow API Responses

**Problem**: API endpoints taking > 5 seconds

**Solution**:
```bash
# Enable query logging
export LOGGING_LEVEL_ORG_HIBERNATE_SQL=DEBUG
docker-compose restart backend

# Check slow queries in database
psql eduplatform_db -c "SELECT query, mean_time FROM pg_stat_statements 
  WHERE mean_time > 1000 ORDER BY mean_time DESC LIMIT 10;"

# Add database indexes
psql eduplatform_db < database/add_indexes.sql

# Monitor backend performance
docker stats backend

# Profile with flame graph
sudo apt-get install -y linux-tools
perf record -F 99 -p <java-pid> -g -- sleep 30
perf report
```

### High Memory Usage

**Problem**: Container consuming too much memory

**Solution**:
```bash
# Check memory usage
docker stats

# Increase heap size for Java
# In docker-compose.yml:
# environment:
#   - JAVA_OPTS=-Xmx1g -Xms512m

# Reduce connection pool
# application.properties:
# spring.datasource.hikari.maximum-pool-size=20

# Enable garbage collection logging
export JAVA_OPTS="-verbose:gc -XX:+PrintGCDetails"

# Restart services
docker-compose restart backend
```

### Database Slow Queries

**Problem**: Database queries taking too long

**Solution**:
```bash
# Enable query logging
psql eduplatform_db -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
docker-compose exec postgres /bin/bash -c "psql -U postgres -d eduplatform_db -c 'ALTER SYSTEM SET log_min_duration_statement = 1000;'"

# Check slow query log
docker-compose exec postgres tail -f /var/log/postgresql/postgresql.log | grep duration

# Analyze query plan
psql eduplatform_db -c "EXPLAIN ANALYZE SELECT * FROM submissions WHERE exam_id = 1;"

# Create missing indexes
psql eduplatform_db < database/add_indexes.sql

# Vacuum and analyze
psql eduplatform_db -c "VACUUM ANALYZE;"
```

## Security Issues

### SQL Injection Attempt Detected

**Problem**: Malicious SQL in logs

**Solution**:
```bash
# Review logs
docker-compose logs backend | grep -i "sql\|injection"

# Verify parameterized queries in use
# All queries should use JPA @Query with ?1, ?2 parameters
# Not string concatenation

# Check ORM properly configured
grep -r "@Query" backend/src/

# Update WAF rules
# Add rate limiting for repeated bad requests
```

### Unauthorized Access Attempts

**Problem**: Suspicious login attempts

**Solution**:
```bash
# Check logs
docker-compose logs backend | grep "Unauthorized\|401"

# Enable rate limiting
# application.properties:
# rate.limit.enabled=true
# rate.limit.requests.per.minute=30

# Setup fail2ban
sudo apt-get install fail2ban

# Monitor auth failures
psql eduplatform_db -c "SELECT * FROM audit_logs WHERE action = 'LOGIN_FAILED' 
  ORDER BY created_at DESC LIMIT 10;"
```

### Cross-Site Scripting (XSS) Warning

**Problem**: CSP violations in browser console

**Solution**:
```bash
# Check Content Security Policy headers
curl -i http://localhost:8080/api/health | grep -i "content-security"

# Update CSP in Nginx config
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'";

# Ensure React escaping enabled
// In React, always use {} for variables, not dangerouslySetInnerHTML
```

---

**Still having issues?**

1. Check logs: `docker-compose logs -f`
2. Test connectivity: `curl -v http://localhost:8080`
3. Review configuration: `cat .env`
4. Restart services: `docker-compose restart`
5. Search GitHub Issues: https://github.com/eduplatform/issues
6. Contact support: support@eduplatform.com
