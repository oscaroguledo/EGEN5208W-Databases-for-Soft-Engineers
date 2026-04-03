# Health and Fitness Club Management System

A comprehensive web-based application for managing health and fitness club operations, including member management, trainer scheduling, class enrollment, and equipment maintenance.

**Course**: EGEN5208W - Databases for Software Engineers  
**Institution**: Carleton University  
**Technologies**: PostgreSQL, FastAPI, React, SQLAlchemy, Docker Compose

---

## 📺 Video Demonstration

**Video Link**: [INSERT YOUR VIDEO URL HERE]

*Example: https://youtu.be/YOUR_VIDEO_ID or https://drive.google.com/file/d/YOUR_FILE_ID*

The video demonstrates all 8 required operations:
- ✅ Member: User Registration, Profile Management, Health History, Dashboard
- ✅ Trainer: Set Availability, Schedule View  
- ✅ Admin: Room Booking, Equipment Maintenance

*Note: Replace the link above with your actual video URL before submission.*

---

## 🚀 Setup and Installation

### Prerequisites

- **Docker Desktop** (recommended) or Docker Engine
- **Git** (for cloning the repository)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Quick Start with Docker Compose (Recommended) 🐳

```bash
# 1. Clone and navigate
git clone https://github.com/oscaroguledo/EGEN5208W-Databases-for-Soft-Engineers.git
cd EGEN5208W-Databases-for-Soft-Engineers

# 2. Start all services
docker-compose up --build

# 3. Monitor startup (optional)
docker-compose logs -f
```

#### What Happens Automatically

**📊 Database Initialization**: PostgreSQL container starts, creates `gym_db` database, automatically executes `sql/DDL.sql` (creates tables, views, triggers) and `sql/DML.sql` (populates sample data)

**🔧 Backend Service**: FastAPI server on port 8000 with hot reload and auto database connection

**⚛️ Frontend Service**: React development server on port 3000 with hot reload

#### Access Points

- **🌐 Frontend**: http://localhost:3000
- **📚 API Documentation**: http://localhost:8000/docs
- **🗄️ Database**: localhost:5432 (user: `gym_user`, password: `gym_password`)

#### Default Login Credentials

- **👑 Admin**: `admin@gym.com` / `password123`
- **🏋 Trainer**: `trainer1@gym.com` / `password123`
- **👤 Member**: `member1@gym.com` / `password123`

---

## 📋 Application Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: FastAPI + Python 3.11 + SQLAlchemy + Pydantic
- **Database**: PostgreSQL 15 + AsyncPG driver
- **Containerization**: Docker Compose + Multi-stage builds
- **Authentication**: Direct password validation with bcrypt password hashing

### Security Assumptions
- **Local Development**: No HTTPS/TLS setup in development mode
- **Database Security**: Database not exposed to public internet, only accessible within Docker network
- **Default Credentials**: Sample passwords are for development only (change in production)
- **Password Authentication**: Direct password validation with bcrypt hashing

### Project Structure

```
EGEN5208W-Databases-for-Soft-Engineers/
├── app/
│   ├── docker-compose.yml          # Service orchestration
│   ├── frontend/                # React application
│   │   ├── src/
│   │   ├── public/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── backend/                 # FastAPI application
│       ├── src/
│       ├── routes/
│       ├── models/
│       ├── services/
│       ├── core/
│       ├── Dockerfile
│       └── requirements.txt
├── sql/
│   ├── DDL.sql                   # Database schema
│   ├── DML.sql                   # Sample data
│   └── dbdiagram.md              # Schema documentation
└── docs/
    ├── ER_Diagram.pdf            # Entity relationship diagram
    └── Normalization_Evidence.md   # Database design documentation
```

## Database Setup

### 🗄️ Database Files Overview

The project includes two essential SQL files:

- **`sql/DDL.sql`** - Data Definition Language (creates all tables, views, triggers, indexes)
- **`sql/DML.sql`** - Data Manipulation Language (inserts sample data for testing)
- **`sql/dbdiagram.md`** - Database schema documentation for ER diagram
- **`sql/init.sh`** - Database initialization script (for Docker automation)

#### Complete Setup with Database Initialization

```bash
# 1. Navigate to project root
cd /path/to/EGEN5208W-Databases-for-Soft-Engineers

# 2. Start all services (database + backend + frontend)
# This automatically:
# - Creates PostgreSQL database
# - Executes DDL.sql (creates tables/views/triggers)
# - Executes DML.sql (populates sample data)
# - Starts backend API server
# - Starts frontend development server
docker-compose up -d

# 3. Monitor startup (optional)
docker-compose logs -f

# 4. Access applications
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
# Database: localhost:5432 (user: gym_user, password: gym_password)
```

#### Docker Services Details
- **Database**: PostgreSQL 13 on port 5432
  - Auto-creates database and user
  - Auto-executes DDL.sql on startup
  - Auto-executes DML.sql for sample data
- **Backend**: FastAPI on port 8000
  - Hot reload on code changes
  - Auto-connects to database
- **Frontend**: React development server on port 3000
  - Hot reload on code changes
  - Auto-configured API endpoint


## Application Setup

#### Common Database Issues

1. **Docker Database Issues**
   ```bash
   # Check database container logs
   docker-compose logs db
   
   # Restart database service
   docker-compose restart db
   
   # Rebuild database container
   docker-compose up -d --build db
   ```

2. **Connection Issues**
   ```bash
   # Test database connection
   docker-compose exec db pg_isready -U gym_user
   
   # Check database exists
   docker-compose exec db psql -U postgres -c "\l"
   
   # Verify user permissions
   docker-compose exec db psql -U postgres -c "\du"
   ```

## API Documentation

Once the application is running, you can access comprehensive API documentation:

### 📚 Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
  - Interactive API testing interface
  - Auto-generated from FastAPI OpenAPI schema
  - Try all endpoints directly in browser
- **ReDoc**: http://localhost:8000/redoc
  - Alternative API documentation format
  - Mobile-friendly documentation layout
- **OpenAPI Schema**: http://localhost:8000/openapi.json
  - Machine-readable API specification
  - For programmatic access and integration

### 🔗 Frontend API Integration

The frontend uses organized API modules in `src/apis/`:

- **`apis/auth.ts`** - Authentication endpoints (login, logout)
- **`apis/members.ts`** - Member operations (profile, goals, health metrics, dashboard, enrollment, sessions)
- **`apis/trainers.ts`** - Trainer operations (availability, schedule)
- **`apis/admin.ts`** - Admin operations (classes, equipment, room assignments)
- **`apis/health.ts`** - Health tracking endpoints
- **`apis/index.ts`** - Core API client configuration and error handling

### 📋 Complete API Endpoint Coverage

#### Authentication Endpoints
- `POST /auth/login` - User login with direct password validation
- `POST /auth/logout` - User logout and session cleanup

#### Member Operations
- `POST /members/register` - New user registration
- `GET /members/me` - Get current member profile
- `PUT /members/me` - Update member profile information
- `POST /members/goals` - Create or update fitness goals
- `GET /members/health-history` - Retrieve health metrics history
- `POST /members/health-metrics` - Add new health measurements
- `GET /members/dashboard` - Get member dashboard data
- `POST /members/enroll/{class_id}` - Enroll in fitness class
- `DELETE /members/enroll/{class_id}` - Cancel class enrollment
- `POST /members/book-session` - Book personal training session
- `DELETE /members/session/{session_id}` - Cancel training session

#### Trainer Operations
- `POST /trainers/availability` - Set trainer availability time slots
- `GET /trainers/schedule` - View trainer schedule
- `GET /trainers/schedule-optimized` - Optimized schedule using database views

#### Admin Operations
- `POST /admin/classes` - Create new fitness classes
- `PUT /admin/sessions/{session_id}/room` - Assign rooms to training sessions
- `GET /admin/equipment` - List all equipment with status
- `PUT /admin/equipment/{equipment_id}/status` - Update equipment maintenance status
- `GET /admin/equipment-optimized` - Equipment list using database views

### 🔧 API Usage Examples

#### Authentication
```bash
# Login with direct password validation (no JWT tokens)
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@gym.com", "password": "password123"}'

# Access protected endpoint with session cookie
curl -X GET "http://localhost:8000/members/me" \
  -H "Cookie: session_id=YOUR_SESSION_COOKIE"
```

#### Member Operations
```bash
# Get member profile (using session cookie)
curl -X GET "http://localhost:8000/members/me" \
  -H "Cookie: session_id=YOUR_SESSION_COOKIE"

# Update member profile (using session cookie)
curl -X PUT "http://localhost:8000/members/me" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=YOUR_SESSION_COOKIE" \
  -d '{"full_name": "John Doe", "phone": "555-1234"}'
```

### 🌐 Frontend-Backend Communication

- **Base URL**: All frontend API calls use `http://localhost:8000` as base
- **Error Handling**: Centralized error handling in `apis/index.ts`
- **Type Safety**: TypeScript interfaces for all API requests/responses
- **Async/Await**: Modern async/await patterns for API calls
- **Authentication**: Session-based authentication with automatic cookie management

## Default Users (from DML.sql)

### Admin User
- **Email**: admin@gym.com
- **Password**: password123
- **Role**: admin

### Trainer Users
- **Email**: trainer1@gym.com (John Smith)
- **Email**: trainer2@gym.com (Sarah Johnson)
- **Password**: password123
- **Role**: trainer

### Member Users
- **Email**: member1@gym.com (Alice Wilson)
- **Email**: member2@gym.com (Bob Brown)
- **Email**: member3@gym.com (Carol Davis)
- **Password**: password123
- **Role**: member

## API Endpoints

### Member Operations
- `POST /members/register` - User registration
- `GET /members/me` - Get member profile
- `PUT /members/me` - Update member profile
- `POST /members/goals` - Create/update fitness goals
- `GET /members/health-history` - Get health metrics history
- `POST /members/health-metrics` - Add health metric
- `GET /members/dashboard` - Get member dashboard
- `POST /members/enroll/{class_id}` - Enroll in class
- `DELETE /members/enroll/{class_id}` - Cancel enrollment
- `POST /members/book-session` - Book training session
- `DELETE /members/session/{session_id}` - Cancel session

### Trainer Operations
- `POST /trainers/availability` - Set availability
- `GET /trainers/schedule` - View schedule
- `GET /trainers/schedule-optimized` - View schedule (using database view)

### Admin Operations
- `POST /admin/classes` - Create class
- `PUT /admin/sessions/{session_id}/room` - Assign room to session
- `PUT /admin/equipment/{equipment_id}/status` - Update equipment status
- `GET /admin/equipment` - View equipment list
- `GET /admin/equipment-optimized` - View equipment (using database view)

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

## Database Schema

The system uses 13+ tables with proper relationships:

### Core Entities
- **Users** - Base authentication and role management
- **Members** - Member profiles and health data
- **Trainers** - Trainer profiles and availability
- **AdminStaff** - Administrative staff profiles

### Facility Management
- **Rooms** - Physical training spaces
- **Equipment** - Gym equipment with maintenance tracking

### Training & Classes
- **Classes** - Group fitness classes
- **TrainingSessions** - Personal training sessions
- **Enrollments** - Class registrations (junction table)
- **TrainerAvailability** - Trainer time slots

### Health & Billing
- **FitnessGoals** - Member fitness objectives
- **HealthMetrics** - Health tracking data
- **Subscriptions** - Membership plans
- **Payments** - Billing records

### Advanced Features
- **Views**: 3 database views for optimized queries
- **Triggers**: 13+ triggers for business rule enforcement
- **Indexes**: 25+ performance indexes
- **Constraints**: Foreign keys, unique constraints, check constraints

## Testing the Application

### 1. Health Check
```bash
curl http://localhost:8000/
```

### 2. User Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gym.com",
    "password": "password123"
  }'
```

### 3. Access Protected Endpoint
```bash
# Use the token from login response
curl -X GET "http://localhost:8000/members/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Development Notes

### Project Structure
```
backend/
├── core/           # Core application logic
│   ├── auth.py     # Authentication utilities
│   ├── config.py   # Configuration settings
│   ├── db.py       # Database connection
│   └── response.py # API response models
├── models/         # SQLAlchemy models
├── services/       # Business logic services
├── routes/         # API route handlers
├── migrations/      # Database migration scripts
├── main.py         # FastAPI application entry point
└── requirements.txt # Python dependencies
```

### Database Features
- **Views**: Used for complex queries (member dashboard, trainer schedule, equipment maintenance)
- **Triggers**: Enforce business rules (no overlapping bookings, class capacity limits, auto-timestamps)
- **Indexes**: Optimize query performance for common operations
- **Constraints**: Ensure data integrity at database level

### Security
- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control
- SQL injection prevention through ORM
- Input validation with Pydantic models

### Logs and Debugging
- Application logs: Check console output
- Database logs: PostgreSQL logs
- API errors: Check response messages for details

## Performance Considerations

- Database views optimize complex queries
- Indexes improve query performance
- Async operations handle concurrent requests
- Connection pooling manages database connections
- Pagination for large datasets

---

## 📝 Assumptions & Design Decisions

1. **Hard Deletes**: Records are permanently removed when deleted (no soft delete pattern)
2. **Role Inheritance**: Users → Members/Trainers/Admins via shared PK (UUID inheritance)
3. **Simulated Billing**: No real payment gateway (as per project requirements)
4. **Password Authentication**: Direct password validation (no JWT tokens)
5. **Async Database**: SQLAlchemy async for better performance

---

## 🎓 Submission Checklist

- [ ] Video demonstration uploaded (max 15 min)
- [ ] Video link added to README (line 13)
- [ ] Video link added to PROJECT_REPORT.md
- [ ] All 8 operations demonstrated in video
- [ ] ER Diagram included (`docs/ER_Diagram.pdf`)
- [ ] Relational Schema included (`sql/dbdiagram.md`)
- [ ] DDL.sql executable on fresh PostgreSQL
- [ ] DML.sql populates test data successfully
- [ ] Project Report (PDF) created from `PROJECT_REPORT.md`
- [ ] Application runs with `docker-compose up`

**Status: Ready for Submission** ✅
