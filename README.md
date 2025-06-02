# Clinical Appointment Scheduling System - Backend

A comprehensive, production-ready backend API for the Clinical Appointment Scheduling System built with Node.js, Express, MySQL, MongoDB, and Redis.

## 🏗️ Architecture

The backend follows a modular, scalable architecture with clear separation of concerns:

```
backend/
├── config/           # Database and service configurations
├── controllers/      # Route handlers and business logic
├── middleware/       # Custom middleware (auth, validation, etc.)
├── models/           # Data models and database schemas
├── routes/           # API route definitions
├── services/         # Business services (notifications, cache, etc.)
├── utils/            # Utility functions and helpers
├── templates/        # Email templates
├── tests/            # Test suites
├── uploads/          # File upload storage
├── logs/             # Application logs
├── scripts/          # Database seeding and migration scripts
└── nginx/            # Nginx configuration
```

## 🚀 Features

### Core Functionality
- **User Management**: Registration, authentication, profile management
- **Appointment Scheduling**: Book, reschedule, cancel appointments
- **Doctor Management**: Profile, availability, patient management
- **Patient Management**: Health records, appointment history
- **Medical Reports**: File upload, storage, and management
- **Admin Dashboard**: System management and analytics

### Advanced Features
- **Real-time Communication**: Socket.IO for live updates
- **Caching**: Redis-based caching for performance
- **Email Notifications**: Automated appointment confirmations and reminders
- **File Processing**: Image optimization and secure file handling
- **Rate Limiting**: Advanced rate limiting with Redis backend
- **Health Monitoring**: System health checks and alerting
- **API Documentation**: Comprehensive API documentation

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Fine-grained permissions
- **Input Validation**: Comprehensive request validation
- **Security Headers**: Protection against common vulnerabilities
- **Password Hashing**: Bcrypt password encryption
- **Rate Limiting**: Protection against abuse

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Databases**: 
  - MySQL 8.0 (relational data)
  - MongoDB (document storage for medical files)
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: Multer, Sharp
- **Email**: Nodemailer
- **Real-time**: Socket.IO
- **Testing**: Jest, Supertest
- **Monitoring**: Winston logging, Prometheus metrics
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

- Node.js 18.0 or higher
- MySQL 8.0+
- MongoDB 6.0+
- Redis 7.0+
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment template and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
MYSQL_HOST=localhost
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=clinical_appointment_system

MONGODB_URI=mongodb://localhost:27017/clinical_appointment_system

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 3. Database Setup

#### MySQL Setup
```bash
# Create database
mysql -u root -p
CREATE DATABASE clinical_appointment_system;

# Run migrations (if available)
npm run migrate

# Seed database with sample data
npm run seed
```

#### MongoDB Setup
MongoDB collections will be created automatically when the application starts.

### 4. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start

# Test mode
npm test
```

## 🐳 Docker Deployment

### Quick Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Build production image
docker build -t clinical-backend .

# Run with production environment
docker run -d \
  --name clinical-backend \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -v ./uploads:/app/uploads \
  -v ./logs:/app/logs \
  clinical-backend
```

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register           # User registration
POST   /api/auth/login              # User login
POST   /api/auth/refresh            # Refresh token
GET    /api/auth/profile            # Get user profile
PUT    /api/auth/profile            # Update profile
POST   /api/auth/change-password    # Change password
POST   /api/auth/forgot-password    # Request password reset
POST   /api/auth/reset-password     # Reset password
POST   /api/auth/logout             # Logout user
```

### Appointment Endpoints

```
GET    /api/appointments            # List appointments
POST   /api/appointments            # Create appointment
GET    /api/appointments/:id        # Get appointment details
PUT    /api/appointments/:id        # Update appointment
DELETE /api/appointments/:id        # Cancel appointment
GET    /api/appointments/slots      # Available time slots
POST   /api/appointments/:id/confirm # Confirm appointment
```

### Patient Endpoints

```
GET    /api/patients/dashboard      # Patient dashboard
GET    /api/patients/appointments   # Patient appointments
GET    /api/patients/doctors        # Search doctors
GET    /api/patients/health-metrics # Health metrics
PUT    /api/patients/health-metrics # Update health metrics
```

### Doctor Endpoints

```
GET    /api/doctors/dashboard       # Doctor dashboard
GET    /api/doctors/appointments    # Doctor appointments
GET    /api/doctors/patients        # Doctor's patients
GET    /api/doctors/schedule        # Doctor's schedule
PUT    /api/doctors/schedule        # Update schedule
GET    /api/doctors/availability    # Check availability
PUT    /api/doctors/availability    # Set availability
```

### Admin Endpoints

```
GET    /api/admin/dashboard         # Admin dashboard
GET    /api/admin/users             # Manage users
GET    /api/admin/appointments      # All appointments
GET    /api/admin/doctors           # Manage doctors
POST   /api/admin/doctors/approve   # Approve doctor
GET    /api/admin/analytics         # System analytics
GET    /api/admin/health            # System health
```

### Medical Reports

```
POST   /api/medical-reports/upload  # Upload medical file
GET    /api/medical-reports         # List reports
GET    /api/medical-reports/:id     # Get report details
DELETE /api/medical-reports/:id     # Delete report
GET    /api/medical-reports/:id/download # Download file
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=auth
```

### Test Structure

```
tests/
├── setup.js              # Test configuration
├── globalSetup.js         # Global test setup
├── globalTeardown.js      # Global test cleanup
├── api.test.js           # API endpoint tests
├── auth.test.js          # Authentication tests
├── models.test.js        # Model tests
└── services.test.js      # Service tests
```

## 📊 Monitoring & Logging

### Logging

Logs are written to:
- Console (development)
- Files in `./logs/` directory
- Structured JSON format for production

Log levels:
- `error`: Error messages
- `warn`: Warning messages
- `info`: General information
- `debug`: Debug information

### Health Monitoring

```bash
# Check system health
curl http://localhost:5000/api/health

# Detailed health check
curl http://localhost:5000/api/admin/health
```

### Metrics

The application exposes Prometheus metrics at `/metrics` endpoint for monitoring.

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Doctor, Patient)
- Token refresh mechanism
- Secure password hashing with bcrypt

### API Security
- Rate limiting per endpoint
- Input validation and sanitization
- CORS configuration
- Security headers (Helmet.js)
- File upload restrictions

### Data Protection
- Encrypted sensitive data
- Secure file storage
- Database connection encryption
- Environment-based configuration

## ⚡ Performance Optimization

### Caching Strategy
- Redis caching for frequently accessed data
- Doctor availability caching
- Appointment slot caching
- Session management

### Database Optimization
- Connection pooling for MySQL
- Indexed queries
- Optimized schema design
- Connection monitoring

### File Handling
- Image compression and optimization
- Secure file validation
- Efficient file storage
- Download optimization

## 🚨 Error Handling

### Global Error Handler
- Centralized error processing
- Environment-specific error responses
- Error logging and monitoring
- User-friendly error messages

### Validation Errors
- Comprehensive input validation
- Field-specific error messages
- Sanitization and normalization
- Custom validation rules

## 🔄 Development Workflow

### Code Quality
- ESLint configuration
- Prettier code formatting
- Husky git hooks
- Jest testing framework

### Environment Management
- Development environment (`.env`)
- Testing environment (`.env.testing`)
- Production environment (`.env.production`)

### Database Management
- Migration scripts
- Seed data scripts
- Backup procedures
- Schema versioning

## 📈 Scaling Considerations

### Horizontal Scaling
- Stateless application design
- Load balancer ready
- Session storage in Redis
- Database connection pooling

### Performance Monitoring
- Response time tracking
- Error rate monitoring
- Resource usage metrics
- Database performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create a Pull Request

### Code Standards
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Follow conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check existing documentation
- Review test cases for examples

## 🗺️ Roadmap

### Upcoming Features
- [ ] AI-powered appointment scheduling
- [ ] Video consultation integration
- [ ] Payment gateway integration
- [ ] Insurance verification
- [ ] Multi-language support
- [ ] Mobile app API extensions
- [ ] Advanced analytics dashboard
- [ ] Backup and disaster recovery

### Performance Improvements
- [ ] GraphQL API implementation
- [ ] Advanced caching strategies
- [ ] Database sharding
- [ ] CDN integration for file storage
- [ ] Real-time performance monitoring
