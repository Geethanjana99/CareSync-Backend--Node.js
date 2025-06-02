# SSL/TLS Configuration Guide

This guide covers setting up SSL/TLS certificates for the Clinical Appointment Scheduling System backend.

## Table of Contents
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Certificate Management](#certificate-management)
- [Security Headers](#security-headers)
- [Troubleshooting](#troubleshooting)

## Development Setup

### Self-Signed Certificates

For development, you can use self-signed certificates:

```bash
# Navigate to the backend directory
cd backend

# Create ssl directory
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/private-key.pem 2048

# Generate certificate signing request
openssl req -new -key ssl/private-key.pem -out ssl/cert-request.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -in ssl/cert-request.csr -signkey ssl/private-key.pem \
  -out ssl/certificate.pem -days 365 \
  -extensions v3_req -extfile <(cat <<EOF
[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
)

# Clean up
rm ssl/cert-request.csr
```

### Update Environment Variables

Add to your `.env` file:

```env
# SSL Configuration
SSL_ENABLED=true
SSL_CERT_PATH=./ssl/certificate.pem
SSL_KEY_PATH=./ssl/private-key.pem
HTTPS_PORT=3443
```

### Update Server Configuration

The server.js file should include:

```javascript
const fs = require('fs');
const https = require('https');

// SSL Configuration
if (process.env.SSL_ENABLED === 'true') {
  const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };

  const httpsServer = https.createServer(sslOptions, app);
  httpsServer.listen(process.env.HTTPS_PORT || 3443, () => {
    logger.info(`HTTPS Server running on port ${process.env.HTTPS_PORT || 3443}`);
  });
}
```

## Production Setup

### Using Let's Encrypt with Certbot

#### Install Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx

# Using snap (universal)
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

#### Obtain Certificates

```bash
# For domain validation
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Or standalone mode (if nginx is not running)
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com
```

#### Auto-renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Using AWS Certificate Manager (ACM)

If deploying on AWS with Application Load Balancer:

1. Request certificate in ACM console
2. Add domain validation records to your DNS
3. Attach certificate to your ALB
4. Configure ALB to terminate SSL and forward HTTP to backend

### Production Environment Variables

```env
# Production SSL Configuration
SSL_ENABLED=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
HTTPS_PORT=443
```

## Certificate Management

### Certificate Renewal Script

Create `scripts/renew-certs.sh`:

```bash
#!/bin/bash

# Certificate renewal script
LOG_FILE="/var/log/cert-renewal.log"

echo "$(date): Starting certificate renewal" >> $LOG_FILE

# Renew certificates
certbot renew >> $LOG_FILE 2>&1

# Check if renewal was successful
if [ $? -eq 0 ]; then
    echo "$(date): Certificate renewal successful" >> $LOG_FILE
    
    # Restart services if certificates were renewed
    if systemctl is-active --quiet nginx; then
        systemctl reload nginx
        echo "$(date): Nginx reloaded" >> $LOG_FILE
    fi
    
    if systemctl is-active --quiet clinical-scheduler; then
        systemctl restart clinical-scheduler
        echo "$(date): Clinical Scheduler service restarted" >> $LOG_FILE
    fi
else
    echo "$(date): Certificate renewal failed" >> $LOG_FILE
    # Send alert email or notification
fi
```

### Certificate Monitoring

Add to your monitoring system:

```javascript
// Certificate expiry check
const checkCertificateExpiry = async () => {
  try {
    const cert = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
    const certData = forge.pki.certificateFromPem(cert);
    const expiryDate = certData.validity.notAfter;
    const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 30) {
      // Send alert
      logger.warn(`SSL certificate expires in ${daysUntilExpiry} days`);
      // Send notification to admin
    }
    
    return daysUntilExpiry;
  } catch (error) {
    logger.error('Failed to check certificate expiry:', error);
    return null;
  }
};
```

## Security Headers

### Nginx Configuration

```nginx
# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'" always;

# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
```

### Express.js Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Troubleshooting

### Common Issues

#### 1. Certificate Chain Issues

```bash
# Check certificate chain
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Verify certificate
openssl x509 -in /path/to/certificate.pem -text -noout
```

#### 2. Port Binding Issues

```bash
# Check what's using port 443
sudo netstat -tlnp | grep :443

# Check SSL certificate permissions
ls -la /etc/letsencrypt/live/yourdomain.com/
```

#### 3. Firewall Configuration

```bash
# Allow HTTPS traffic
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp  # For HTTP to HTTPS redirect

# For iptables
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
```

### Health Check Script

Create `scripts/ssl-health-check.sh`:

```bash
#!/bin/bash

DOMAIN="yourdomain.com"
PORT="443"

# Check SSL certificate
echo "Checking SSL certificate for $DOMAIN:$PORT"

# Get certificate expiry
EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:$PORT 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_DATE=$(date -d "$EXPIRY" +%s)
CURRENT_DATE=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_DATE - $CURRENT_DATE) / 86400 ))

echo "Certificate expires on: $EXPIRY"
echo "Days until expiry: $DAYS_UNTIL_EXPIRY"

if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    echo "WARNING: Certificate expires in less than 30 days!"
    exit 1
elif [ $DAYS_UNTIL_EXPIRY -lt 7 ]; then
    echo "CRITICAL: Certificate expires in less than 7 days!"
    exit 2
else
    echo "Certificate is valid"
    exit 0
fi
```

### SSL Configuration Test

```bash
# Test SSL configuration
curl -I https://yourdomain.com/api/health

# Test SSL labs rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# Test certificate transparency
# Visit: https://crt.sh/?q=yourdomain.com
```

## Best Practices

1. **Always use strong ciphers**: Disable weak ciphers and protocols
2. **Enable HSTS**: Force HTTPS connections
3. **Use certificate pinning**: For mobile applications
4. **Monitor certificate expiry**: Set up alerts 30 days before expiry
5. **Keep certificates secure**: Proper file permissions (600 for private keys)
6. **Use automation**: Automate certificate renewal and deployment
7. **Test regularly**: Regular SSL/TLS configuration testing

## References

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
- [SSL Labs Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)
