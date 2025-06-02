# Production Deployment Guide

This guide covers deploying the Clinical Appointment Scheduling System backend to production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Server Setup](#server-setup)
- [Database Setup](#database-setup)
- [Application Deployment](#application-deployment)
- [Monitoring Setup](#monitoring-setup)
- [Security Hardening](#security-hardening)
- [Backup Configuration](#backup-configuration)
- [Maintenance](#maintenance)

## Prerequisites

### System Requirements

**Minimum Hardware:**
- CPU: 2 cores, 2.5 GHz
- RAM: 4 GB
- Storage: 50 GB SSD
- Network: 1 Gbps

**Recommended Hardware:**
- CPU: 4+ cores, 3.0+ GHz
- RAM: 8+ GB
- Storage: 100+ GB SSD
- Network: 1+ Gbps

**Operating System:**
- Ubuntu 20.04 LTS or later
- CentOS 8 or later
- Amazon Linux 2
- Debian 11 or later

### Software Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Docker and Docker Compose
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Install Nginx
sudo apt install -y nginx
sudo systemctl enable nginx

# Install additional tools
sudo apt install -y curl wget git htop ufw fail2ban
```

## Server Setup

### 1. Create Application User

```bash
# Create application user
sudo useradd -m -s /bin/bash clinical-scheduler
sudo usermod -aG docker clinical-scheduler

# Create application directory
sudo mkdir -p /opt/clinical-scheduler
sudo chown clinical-scheduler:clinical-scheduler /opt/clinical-scheduler
```

### 2. Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. System Limits

Create `/etc/security/limits.d/clinical-scheduler.conf`:

```
clinical-scheduler soft nofile 65536
clinical-scheduler hard nofile 65536
clinical-scheduler soft nproc 4096
clinical-scheduler hard nproc 4096
```

## Database Setup

### MySQL Setup

```bash
# Install MySQL 8.0
sudo apt install -y mysql-server-8.0

# Secure installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p << EOF
CREATE DATABASE clinical_scheduler CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'clinical_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON clinical_scheduler.* TO 'clinical_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Configure MySQL for production
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

MySQL configuration additions:

```ini
# Performance tuning
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 1
innodb_file_per_table = 1

# Security
bind-address = 127.0.0.1
skip-networking = 0

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

### MongoDB Setup

```bash
# Install MongoDB 6.0
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database user
mongosh << EOF
use admin
db.createUser({
  user: "clinical_user",
  pwd: "strong_password_here",
  roles: ["readWrite", "dbAdmin"]
})
EOF
```

### Redis Setup

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
```

Redis configuration:

```
# Security
requirepass your_redis_password
bind 127.0.0.1

# Memory management
maxmemory 1gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
```

## Application Deployment

### 1. Code Deployment

```bash
# Switch to application user
sudo su - clinical-scheduler

# Clone repository
cd /opt/clinical-scheduler
git clone https://github.com/your-repo/clinical-scheduler.git .

# Install dependencies
cd backend
npm ci --production

# Create environment file
cp .env.production .env
nano .env
```

### 2. Environment Configuration

```env
# Application
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.yourdomain.com

# Database URLs
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=clinical_user
MYSQL_PASSWORD=strong_password_here
MYSQL_DATABASE=clinical_scheduler

MONGODB_URI=mongodb://clinical_user:strong_password_here@localhost:27017/clinical_scheduler

REDIS_URL=redis://:your_redis_password@localhost:6379

# Security
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key

# SSL
SSL_ENABLED=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem

# Email
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=email_password

# File uploads
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
PROMETHEUS_ENABLED=true
LOG_LEVEL=info
```

### 3. Database Migration

```bash
# Run migrations
npm run migrate

# Seed initial data (if needed)
npm run seed:production
```

### 4. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'clinical-scheduler',
    script: 'server.js',
    cwd: '/opt/clinical-scheduler/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/clinical-scheduler/error.log',
    out_file: '/var/log/clinical-scheduler/out.log',
    log_file: '/var/log/clinical-scheduler/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 5. Start Application

```bash
# Create log directory
sudo mkdir -p /var/log/clinical-scheduler
sudo chown clinical-scheduler:clinical-scheduler /var/log/clinical-scheduler

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Enable PM2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u clinical-scheduler --hp /home/clinical-scheduler
```

## Nginx Configuration

Create `/etc/nginx/sites-available/clinical-scheduler`:

```nginx
upstream clinical_scheduler {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s backup;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Client max body size
    client_max_body_size 10M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # API routes
    location /api/ {
        proxy_pass http://clinical_scheduler;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://clinical_scheduler;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        proxy_pass http://clinical_scheduler;
        proxy_set_header Host $host;
    }

    # Static files (if serving any)
    location /uploads/ {
        alias /opt/clinical-scheduler/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Error pages
    error_page 502 503 504 /maintenance.html;
    location = /maintenance.html {
        root /var/www/html;
        internal;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/clinical-scheduler /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Monitoring Setup

### 1. Prometheus Configuration

Create `/opt/monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'clinical-scheduler'
    static_configs:
      - targets: ['localhost:3000']
    scrape_interval: 5s
    metrics_path: '/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'mysql-exporter'
    static_configs:
      - targets: ['localhost:9104']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['localhost:9121']
```

### 2. Start Monitoring Stack

```bash
# Create monitoring directory
sudo mkdir -p /opt/monitoring
cd /opt/monitoring

# Copy monitoring files
sudo cp /opt/clinical-scheduler/backend/monitoring/* ./

# Start monitoring stack
sudo docker-compose -f /opt/clinical-scheduler/backend/docker-compose.yml up -d prometheus grafana alertmanager
```

## Security Hardening

### 1. System Hardening

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Disable root login
sudo passwd -l root

# Configure SSH
sudo nano /etc/ssh/sshd_config
```

SSH configuration:

```
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
```

### 2. Application Security

```bash
# Set proper file permissions
sudo chown -R clinical-scheduler:clinical-scheduler /opt/clinical-scheduler
sudo chmod -R 750 /opt/clinical-scheduler
sudo chmod 600 /opt/clinical-scheduler/backend/.env

# Secure log files
sudo chown -R clinical-scheduler:adm /var/log/clinical-scheduler
sudo chmod -R 640 /var/log/clinical-scheduler
```

### 3. Database Security

```bash
# MySQL security
sudo mysql_secure_installation

# Create backup user with limited privileges
mysql -u root -p << EOF
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'backup_password';
GRANT SELECT, LOCK TABLES ON clinical_scheduler.* TO 'backup_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

## Backup Configuration

### 1. Database Backup Script

Create `/opt/clinical-scheduler/scripts/backup-db.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_USER="backup_user"
MYSQL_PASS="backup_password"
MYSQL_DB="clinical_scheduler"

# Create backup directory
mkdir -p $BACKUP_DIR

# MySQL backup
mysqldump -u $MYSQL_USER -p$MYSQL_PASS $MYSQL_DB | gzip > $BACKUP_DIR/mysql_$DATE.sql.gz

# MongoDB backup
mongodump --host localhost --db clinical_scheduler --out $BACKUP_DIR/mongo_$DATE

# Compress MongoDB backup
tar -czf $BACKUP_DIR/mongo_$DATE.tar.gz -C $BACKUP_DIR mongo_$DATE
rm -rf $BACKUP_DIR/mongo_$DATE

# Remove old backups (keep 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 2. Schedule Backups

```bash
# Add to crontab
sudo crontab -e

# Add these lines:
# Daily backup at 2 AM
0 2 * * * /opt/clinical-scheduler/scripts/backup-db.sh

# Weekly full system backup
0 3 * * 0 /opt/clinical-scheduler/scripts/backup-full.sh
```

## Maintenance

### 1. Log Rotation

Create `/etc/logrotate.d/clinical-scheduler`:

```
/var/log/clinical-scheduler/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 640 clinical-scheduler adm
    postrotate
        pm2 reload clinical-scheduler > /dev/null 2>&1 || true
    endscript
}
```

### 2. Health Check Script

Create `/opt/clinical-scheduler/scripts/health-check.sh`:

```bash
#!/bin/bash

API_URL="https://yourdomain.com/api/health"
ALERT_EMAIL="admin@yourdomain.com"

# Check API health
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $HTTP_STATUS -ne 200 ]; then
    echo "API health check failed with status: $HTTP_STATUS" | mail -s "Clinical Scheduler Alert" $ALERT_EMAIL
    exit 1
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is at ${DISK_USAGE}%" | mail -s "Disk Space Alert" $ALERT_EMAIL
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
    echo "Memory usage is at ${MEM_USAGE}%" | mail -s "Memory Usage Alert" $ALERT_EMAIL
fi

echo "Health check passed"
```

### 3. Update Script

Create `/opt/clinical-scheduler/scripts/update.sh`:

```bash
#!/bin/bash

APP_DIR="/opt/clinical-scheduler"
BACKUP_DIR="/opt/backups/app"

# Create backup
mkdir -p $BACKUP_DIR
cp -r $APP_DIR $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)

# Pull latest code
cd $APP_DIR
git pull origin main

# Install dependencies
cd backend
npm ci --production

# Run migrations
npm run migrate

# Restart application
pm2 restart clinical-scheduler

echo "Application updated successfully"
```

## Deployment Checklist

- [ ] Server provisioned and secured
- [ ] Databases installed and configured
- [ ] Application deployed and running
- [ ] SSL certificates installed
- [ ] Nginx configured and running
- [ ] Monitoring stack deployed
- [ ] Backup system configured
- [ ] Log rotation configured
- [ ] Health checks implemented
- [ ] Security hardening completed
- [ ] DNS records configured
- [ ] Load testing completed
- [ ] Documentation updated

## Troubleshooting

### Common Issues

1. **Port binding errors**: Check if ports are already in use
2. **Database connection issues**: Verify credentials and network connectivity
3. **SSL certificate problems**: Check certificate paths and permissions
4. **High memory usage**: Monitor and adjust PM2 configuration
5. **Slow response times**: Check database performance and add indexes

### Useful Commands

```bash
# Check application status
pm2 status
pm2 logs clinical-scheduler

# Check system resources
htop
df -h
free -h

# Check network connectivity
netstat -tlnp
ss -tlnp

# Check SSL certificate
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Test API endpoints
curl -I https://yourdomain.com/api/health
```
