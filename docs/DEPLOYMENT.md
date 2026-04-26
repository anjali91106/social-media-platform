# Deployment Documentation

## Overview

This document provides comprehensive deployment instructions for the social media platform, including local development, staging, and production environments.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)      │◄──►│   (MongoDB)     │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   Socket.io     │    │   Cloudinary    │
│   (Reverse      │    │   (Real-time)   │    │   (Images)      │
│   Proxy)        │    │   Port: 5000    │    │   (Cloud)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Environment Types

### Development
- **Purpose**: Local development and testing
- **Database**: Local MongoDB instance
- **File Storage**: Local uploads
- **Logging**: Verbose console output
- **Hot Reload**: Enabled for both frontend and backend

### Staging
- **Purpose**: Pre-production testing
- **Database**: MongoDB Atlas staging cluster
- **File Storage**: Cloudinary staging environment
- **Monitoring**: Basic performance tracking
- **Domain**: staging.yourdomain.com

### Production
- **Purpose**: Live application
- **Database**: MongoDB Atlas production cluster
- **File Storage**: Cloudinary production environment
- **Monitoring**: Full performance and error tracking
- **Domain**: yourdomain.com

---

## Local Development Setup

### Prerequisites

- **Node.js**: 18.x or higher
- **MongoDB**: 5.0 or higher
- **Git**: For version control
- **Docker**: (Optional) For containerized development

### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/social-media-platform.git
cd social-media-platform
```

### Step 2: Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Backend .env Configuration:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/social-media-dev

# JWT Secrets (generate secure secrets)
JWT_ACCESS_SECRET=your-super-secure-access-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development

# Cloudinary (optional for development)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Step 3: Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Frontend .env Configuration:**
```env
# API URLs
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Environment
VITE_NODE_ENV=development

# Site URL (for SEO)
VITE_SITE_URL=http://localhost:3000

# Analytics (optional)
VITE_GA_TRACKING_ID=your-ga-id
```

### Step 4: Database Setup

**Option A: Local MongoDB**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Verify connection
mongosh --eval "db.adminCommand('ismaster')"
```

**Option B: MongoDB Atlas**
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Update `MONGODB_URI` in backend .env

### Step 5: Run Application

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

---

## Docker Development Setup

### Docker Compose Configuration

**docker-compose.dev.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    container_name: social-media-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: social-media-dev
    volumes:
      - mongodb_data:/data/db
      - ./scripts/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile.dev
    container_name: social-media-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/social-media-dev?authSource=admin
      - JWT_ACCESS_SECRET=dev-access-secret
      - JWT_REFRESH_SECRET=dev-refresh-secret
      - FRONTEND_URL=http://localhost:3000
    volumes:
      - ./server:/app
      - /app/node_modules
    depends_on:
      - mongodb
    command: npm run dev

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile.dev
    container_name: social-media-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:5000/api
      - VITE_SOCKET_URL=http://localhost:5000
      - VITE_NODE_ENV=development
    volumes:
      - ./client:/app
      - /app/node_modules
    depends_on:
      - backend
    command: npm run dev

volumes:
  mongodb_data:
```

### Development Dockerfiles

**server/Dockerfile.dev:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
```

**client/Dockerfile.dev:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Run Docker Development

```bash
# Build and start all services
docker-compose -f docker-compose.dev.yml up --build

# Stop services
docker-compose -f docker-compose.dev.yml down

# Remove volumes
docker-compose -f docker-compose.dev.yml down -v
```

---

## Production Deployment

### Option 1: Traditional Server Deployment

#### Server Requirements

- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: Minimum 20GB SSD
- **CPU**: Minimum 2 cores, Recommended 4+
- **Network**: Stable internet connection

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable services
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Step 2: Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/social-media
sudo chown $USER:$USER /var/www/social-media

# Clone repository
cd /var/www/social-media
git clone https://github.com/your-username/social-media-platform.git .

# Backend setup
cd server
npm ci --production
cp .env.example .env
nano .env  # Configure production variables

# Frontend build
cd ../client
npm ci
npm run build

# Create PM2 ecosystem file
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [
    {
      name: 'social-media-backend',
      script: './server/server.js',
      cwd: '/var/www/social-media',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
```

#### Step 3: Nginx Configuration

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/social-media
```

**/etc/nginx/sites-available/social-media:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend static files
    location / {
        root /var/www/social-media/client/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.io proxy
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        image/svg+xml;

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/social-media /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 4: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Step 5: Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Monitor application
pm2 monit
```

### Option 2: Docker Production Deployment

#### Production Docker Compose

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: social-media-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./client/dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
    networks:
      - social-media-network

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: social-media-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/social-media-prod
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - FRONTEND_URL=https://yourdomain.com
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
    depends_on:
      - mongodb
    networks:
      - social-media-network
    volumes:
      - ./logs:/app/logs

  mongodb:
    image: mongo:5.0
    container_name: social-media-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: social-media-prod
    volumes:
      - mongodb_data:/data/db
      - ./scripts/init-mongo-prod.js:/docker-entrypoint-initdb.d/init-mongo-prod.js:ro
    networks:
      - social-media-network

networks:
  social-media-network:
    driver: bridge

volumes:
  mongodb_data:
```

#### Environment Variables

**.env.prod:**
```env
# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password

# JWT
JWT_ACCESS_SECRET=your-super-secure-access-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Deploy with Docker

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update deployment
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Cloud Platform Deployment

### Option 1: Heroku

#### Backend Deployment

**Procfile:**
```
web: npm start
```

**server/package.json - Add:**
```json
{
  "engines": {
    "node": "18.x",
    "npm": "8.x"
  }
}
```

**Deploy Commands:**
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_ACCESS_SECRET=your-secret
heroku config:set JWT_REFRESH_SECRET=your-secret
heroku config:set FRONTEND_URL=https://your-app-name.herokuapp.com

# Deploy backend
cd server
git subtree push --prefix server heroku main
```

#### Frontend Deployment

**client/package.json - Add:**
```json
{
  "scripts": {
    "build": "vite build",
    "start": "vite preview"
  },
  "engines": {
    "node": "18.x",
    "npm": "8.x"
  }
}
```

**Deploy Commands:**
```bash
# Build frontend
cd client
npm run build

# Deploy to static site
npm install -g heroku-static
heroku create your-app-name-frontend --buildpack heroku/static
git subtree push --prefix client heroku main
```

### Option 2: AWS (Elastic Beanstalk)

#### Setup

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init social-media-platform

# Create environment
eb create production

# Deploy
eb deploy

# Open application
eb open
```

#### Configuration Files

**.elasticbeanstalk/config/nginx/conf.d/elasticbeanstalk.conf:**
```nginx
location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### Option 3: DigitalOcean

#### App Platform Setup

1. Create DigitalOcean account
2. Create new App
3. Connect GitHub repository
4. Configure build and run commands
5. Set environment variables
6. Deploy

**Build Commands:**
- Backend: `npm install && npm run build`
- Frontend: `npm install && npm run build`

**Run Commands:**
- Backend: `npm start`
- Frontend: `npm start` (using serve)

---

## CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd server && npm ci
          cd ../client && npm ci
      - name: Run tests
        run: |
          cd server && npm test
          cd ../client && npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Build frontend
        run: |
          cd client
          npm ci
          npm run build
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/social-media
            git pull origin main
            cd client && npm run build
            pm2 restart social-media-backend
```

### Environment Variables Setup

**GitHub Secrets:**
- `HOST`: Server IP address
- `USERNAME`: Server username
- `SSH_KEY`: Private SSH key
- `MONGODB_URI`: Database connection string
- `JWT_ACCESS_SECRET`: JWT access secret
- `JWT_REFRESH_SECRET`: JWT refresh secret

---

## Monitoring and Logging

### Application Monitoring

**PM2 Monitoring:**
```bash
# View process status
pm2 status

# View logs
pm2 logs

# Monitor dashboard
pm2 monit

# View metrics
pm2 show social-media-backend
```

### Log Management

**Log Rotation Setup:**
```bash
# Install logrotate
sudo apt install logrotate

# Create logrotate config
sudo nano /etc/logrotate.d/social-media
```

**/etc/logrotate.d/social-media:**
```
/var/www/social-media/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Performance Monitoring

**New Relic Integration:**
```bash
# Install New Relic
npm install newrelic

# Configure in server.js
require('newrelic');
```

**newrelic.js:**
```javascript
exports.config = {
  app_name: ['Social Media Platform'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  application_logging: {
    forwarding: {
      enabled: true
    }
  }
};
```

---

## Security Best Practices

### Server Security

```bash
# Update system regularly
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Setup fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Application Security

**Environment Variables:**
- Never commit secrets to repository
- Use strong, randomly generated secrets
- Rotate secrets regularly
- Use different secrets for different environments

**Database Security:**
- Use authentication with strong passwords
- Enable SSL/TLS connections
- Limit network access
- Regular backups

**API Security:**
- Implement rate limiting
- Use HTTPS everywhere
- Validate all inputs
- Sanitize outputs

---

## Backup and Recovery

### Database Backup

**Automated Backup Script:**
```bash
#!/bin/bash
# backup-mongodb.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"
DB_NAME="social-media-prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mongodump --db $DB_NAME --out $BACKUP_DIR/backup_$DATE

# Compress backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR backup_$DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/backup_$DATE

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

**Cron Job for Daily Backups:**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-mongodb.sh
```

### Application Backup

```bash
# Backup application files
#!/bin/bash
# backup-app.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/app"
APP_DIR="/var/www/social-media"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C $APP_DIR .

# Remove backups older than 7 days
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: app_backup_$DATE.tar.gz"
```

---

## Troubleshooting

### Common Issues

**Application Won't Start:**
```bash
# Check logs
pm2 logs
tail -f /var/www/social-media/logs/combined.log

# Check port usage
sudo netstat -tulpn | grep :5000

# Check MongoDB connection
mongosh --eval "db.adminCommand('ismaster')"
```

**Nginx Issues:**
```bash
# Test configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

**Database Issues:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Connect to database
mongosh social-media-prod
```

### Performance Issues

**High CPU Usage:**
```bash
# Check process usage
top
htop

# Check PM2 processes
pm2 monit

# Identify slow queries
mongosh --eval "db.setProfilingLevel(2)"
mongosh --eval "db.system.profile.find().limit(5).sort({ts:-1}).pretty()"
```

**High Memory Usage:**
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Check Node.js memory
pm2 show social-media-backend
```

---

## Scaling Considerations

### Horizontal Scaling

**Load Balancer Setup:**
```nginx
upstream backend {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

**PM2 Cluster Mode:**
```javascript
module.exports = {
  apps: [
    {
      name: 'social-media-backend',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### Database Scaling

**MongoDB Sharding:**
- Set up config servers
- Create shard servers
- Enable sharding for collections
- Configure chunk size

**Read Replicas:**
- Set up secondary instances
- Configure read preferences
- Monitor replication lag

### CDN Integration

**CloudFront Setup:**
```javascript
// Configure asset URLs in production
const CDN_URL = 'https://your-cdn.cloudfront.net';

// Use CDN for static assets
const assetUrl = (path) => `${CDN_URL}${path}`;
```

---

## Maintenance

### Regular Tasks

**Weekly:**
- Update dependencies
- Check security advisories
- Review error logs
- Monitor performance metrics

**Monthly:**
- Rotate secrets
- Update SSL certificates
- Database maintenance
- Backup verification

**Quarterly:**
- Security audit
- Performance review
- Capacity planning
- Disaster recovery testing

### Update Procedures

**Application Updates:**
```bash
# Backup current version
cp -r /var/www/social-media /var/www/social-media-backup

# Pull latest changes
cd /var/www/social-media
git pull origin main

# Update dependencies
cd server && npm ci
cd ../client && npm ci && npm run build

# Restart application
pm2 restart social-media-backend

# Verify deployment
curl -f http://localhost:5000/health
```

**Database Updates:**
```bash
# Create backup before updates
./backup-mongodb.sh

# Run migrations if needed
mongosh social-media-prod migrations.js

# Verify data integrity
mongosh --eval "db.posts.count()"
```

---

## Support and Emergency Procedures

### Emergency Contacts

- **Development Team**: dev-team@yourcompany.com
- **System Administrator**: admin@yourcompany.com
- **Database Administrator**: dba@yourcompany.com

### Incident Response

1. **Assessment**: Determine scope and impact
2. **Communication**: Notify stakeholders
3. **Containment**: Isolate affected systems
4. **Resolution**: Implement fix
5. **Recovery**: Restore services
6. **Post-mortem**: Document lessons learned

### Rollback Procedures

**Application Rollback:**
```bash
# Stop current version
pm2 stop social-media-backend

# Restore previous version
cp -r /var/www/social-media-backup/* /var/www/social-media/

# Restart application
pm2 start social-media-backend
```

**Database Rollback:**
```bash
# Stop application
pm2 stop social-media-backend

# Restore database
mongorestore --db social-media-prod /path/to/backup

# Restart application
pm2 start social-media-backend
```
