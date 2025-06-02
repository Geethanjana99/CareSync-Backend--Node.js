#!/bin/bash

# Clinical Appointment Scheduling System - Backend Setup & Maintenance Script
# This script provides utilities for setting up, maintaining, and deploying the backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$BACKEND_DIR/logs/maintenance.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
error() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

# Success message
success() {
    log "${GREEN}SUCCESS: $1${NC}"
}

# Warning message
warning() {
    log "${YELLOW}WARNING: $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    log "Checking dependencies..."
    
    local deps=("node" "npm" "mysql" "mongosh" "redis-cli" "docker" "pm2")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing[*]}"
    fi
    
    success "All dependencies are installed"
}

# Setup environment
setup_environment() {
    log "Setting up environment..."
    
    cd "$BACKEND_DIR"
    
    # Install Node.js dependencies
    log "Installing Node.js dependencies..."
    npm ci
    
    # Create necessary directories
    log "Creating directories..."
    mkdir -p uploads logs backups
    
    # Copy environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            warning "Created .env from .env.example. Please configure it before running the application."
        else
            error ".env.example file not found"
        fi
    fi
    
    success "Environment setup completed"
}

# Database operations
setup_databases() {
    log "Setting up databases..."
    
    # Check MySQL connection
    if ! mysql -e "SELECT 1" &> /dev/null; then
        error "Cannot connect to MySQL. Please ensure MySQL is running and credentials are correct."
    fi
    
    # Check MongoDB connection
    if ! mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        error "Cannot connect to MongoDB. Please ensure MongoDB is running."
    fi
    
    # Check Redis connection
    if ! redis-cli ping &> /dev/null; then
        error "Cannot connect to Redis. Please ensure Redis is running."
    fi
    
    # Run database migrations
    log "Running database migrations..."
    npm run migrate || error "Database migration failed"
    
    success "Databases setup completed"
}

# Start services
start_services() {
    log "Starting services..."
    
    cd "$BACKEND_DIR"
    
    # Start with PM2 in production
    if [ "${NODE_ENV:-development}" = "production" ]; then
        log "Starting with PM2..."
        pm2 start ecosystem.config.js
        pm2 save
    else
        log "Starting in development mode..."
        npm run dev &
    fi
    
    success "Services started"
}

# Stop services
stop_services() {
    log "Stopping services..."
    
    if [ "${NODE_ENV:-development}" = "production" ]; then
        pm2 stop clinical-scheduler || true
    else
        pkill -f "node.*server.js" || true
    fi
    
    success "Services stopped"
}

# Restart services
restart_services() {
    log "Restarting services..."
    stop_services
    sleep 2
    start_services
}

# Backup databases
backup_databases() {
    log "Creating database backups..."
    
    local backup_dir="$BACKEND_DIR/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # MySQL backup
    if [ -n "${MYSQL_DATABASE:-}" ]; then
        log "Backing up MySQL database..."
        mysqldump "${MYSQL_DATABASE}" | gzip > "$backup_dir/mysql_backup.sql.gz"
    fi
    
    # MongoDB backup
    if [ -n "${MONGODB_DATABASE:-}" ]; then
        log "Backing up MongoDB database..."
        mongodump --db "${MONGODB_DATABASE}" --out "$backup_dir"
        tar -czf "$backup_dir/mongodb_backup.tar.gz" -C "$backup_dir" "${MONGODB_DATABASE}"
        rm -rf "$backup_dir/${MONGODB_DATABASE}"
    fi
    
    success "Database backups created in $backup_dir"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    cd "$BACKEND_DIR"
    
    # Install test dependencies
    npm ci
    
    # Run tests
    npm test || error "Tests failed"
    
    success "All tests passed"
}

# Check system health
health_check() {
    log "Performing health check..."
    
    local api_url="${API_BASE_URL:-http://localhost:3000}"
    
    # Check if API is responding
    if curl -f -s "$api_url/api/health" > /dev/null; then
        success "API health check passed"
    else
        error "API health check failed"
    fi
    
    # Check database connections
    if curl -f -s "$api_url/api/health/database" > /dev/null; then
        success "Database health check passed"
    else
        error "Database health check failed"
    fi
    
    # Check disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 80 ]; then
        warning "Disk usage is at ${disk_usage}%"
    else
        log "Disk usage: ${disk_usage}%"
    fi
    
    # Check memory usage
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$mem_usage" -gt 80 ]; then
        warning "Memory usage is at ${mem_usage}%"
    else
        log "Memory usage: ${mem_usage}%"
    fi
    
    success "Health check completed"
}

# Update application
update_application() {
    log "Updating application..."
    
    cd "$BACKEND_DIR"
    
    # Create backup before update
    backup_databases
    
    # Pull latest code
    if [ -d ".git" ]; then
        log "Pulling latest code..."
        git pull origin main || error "Failed to pull latest code"
    fi
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci || error "Failed to install dependencies"
    
    # Run migrations
    log "Running migrations..."
    npm run migrate || error "Migration failed"
    
    # Restart services
    restart_services
    
    # Run health check
    sleep 10
    health_check
    
    success "Application updated successfully"
}

# Cleanup old logs and backups
cleanup() {
    log "Cleaning up old files..."
    
    # Remove old log files (older than 30 days)
    find "$BACKEND_DIR/logs" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # Remove old backups (older than 7 days)
    find "$BACKEND_DIR/backups" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    
    # Remove old uploaded files (if cleanup is enabled)
    if [ "${CLEANUP_UPLOADS:-false}" = "true" ]; then
        find "$BACKEND_DIR/uploads" -type f -mtime +90 -delete 2>/dev/null || true
    fi
    
    success "Cleanup completed"
}

# Show status
show_status() {
    log "System Status:"
    echo "----------------------------------------"
    
    # PM2 status (if running in production)
    if command -v pm2 &> /dev/null && pm2 list | grep -q "clinical-scheduler"; then
        echo "PM2 Status:"
        pm2 list
        echo ""
    fi
    
    # Database status
    echo "Database Status:"
    if mysql -e "SELECT 1" &> /dev/null; then
        echo "✅ MySQL: Connected"
    else
        echo "❌ MySQL: Disconnected"
    fi
    
    if mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        echo "✅ MongoDB: Connected"
    else
        echo "❌ MongoDB: Disconnected"
    fi
    
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis: Connected"
    else
        echo "❌ Redis: Disconnected"
    fi
    
    echo ""
    
    # Disk and memory usage
    echo "System Resources:"
    echo "Disk Usage: $(df / | awk 'NR==2 {print $5}')"
    echo "Memory Usage: $(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
    echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
    
    echo "----------------------------------------"
}

# Show help
show_help() {
    cat << EOF
Clinical Appointment Scheduling System - Backend Maintenance Script

Usage: $0 [COMMAND]

Commands:
    setup           Set up the environment and dependencies
    start           Start the application services
    stop            Stop the application services
    restart         Restart the application services
    test            Run the test suite
    health          Perform system health check
    backup          Create database backups
    update          Update the application (pull code, install deps, migrate)
    cleanup         Clean up old logs and backups
    status          Show system status
    help            Show this help message

Examples:
    $0 setup        # Initial setup
    $0 start        # Start services
    $0 health       # Check system health
    $0 update       # Update application

Environment Variables:
    NODE_ENV        Environment (development/production)
    API_BASE_URL    Base URL for health checks
    CLEANUP_UPLOADS Enable cleanup of old uploaded files (true/false)

EOF
}

# Main function
main() {
    case "${1:-help}" in
        "setup")
            check_dependencies
            setup_environment
            setup_databases
            ;;
        "start")
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "test")
            run_tests
            ;;
        "health")
            health_check
            ;;
        "backup")
            backup_databases
            ;;
        "update")
            update_application
            ;;
        "cleanup")
            cleanup
            ;;
        "status")
            show_status
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
