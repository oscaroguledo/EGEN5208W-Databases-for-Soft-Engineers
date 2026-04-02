# Health and Fitness Club Management System

A comprehensive web-based application for managing health and fitness club operations, including member management, trainer scheduling, class enrollment, and equipment maintenance.

**Course**: EGEN5208W - Databases for Software Engineers  
**Institution**: Carleton University  
**Technologies**: PostgreSQL, FastAPI, React, SQLAlchemy

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

## 🚀 Quick Start (Recommended)

The fastest way to run the application using Docker Compose:

```bash
# 1. Navigate to app directory
cd app

# 2. Start all services (database + backend + frontend)
docker-compose up -d

# 3. Access the application
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

**Default Login Credentials:**
- Admin: `admin@gym.com` / `password123`
- Trainer: `trainer1@gym.com` / `password123`
- Member: `member1@gym.com` / `password123`

## Database Setup

### Option 1: Manual Database Setup
#### 1. Create Database
```sql
CREATE DATABASE gym_db;
CREATE USER gym_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gym_db TO gym_user;
```

#### 2. Execute DDL Script
```bash
psql -d gym_db -U gym_user -f sql/DDL.sql
```

#### 3. Execute DML Script (Sample Data)
```bash
psql -d gym_db -U gym_user -f sql/DML.sql
```

### Option 2: Docker Compose (Recommended)
#### 1. Start All Services with Docker Compose
```bash
# Navigate to the app directory
cd app

# Start all services (database, backend, frontend)
docker-compose up -d

# View logs to monitor startup
docker-compose logs -f

# Stop services when done
docker-compose down
```

#### 2. Docker Services
- **Database**: PostgreSQL 13 on port 5432 (auto-initialized with DDL/DML)
- **Backend**: FastAPI on port 8000 (auto-restarts on code changes)
- **Frontend**: Web interface on port 3000 (auto-restarts on code changes)

#### 3. Access Points
- **API Documentation**: http://localhost:8000/docs
- **Frontend Application**: http://localhost:3000
- **Database**: localhost:5432 (user: gym_user, password: gym_password)

## Application Setup

### Option 1: Docker Compose (Recommended)
See "Option 2: Docker Compose" in Database Setup section above.

### Option 2: Manual Setup
#### 1. Clone/Download the Project
```bash
# Navigate to the project directory
cd /path/to/EGEN5208W-Databases-for-Soft-Engineers
```

#### 2. Create Virtual Environment
```bash
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install -r app/backend/requirements.txt
```

#### 4. Environment Configuration
Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://gym_user:your_password@localhost/gym_db

# Application Configuration
APP_NAME="Health and Fitness Club Management System"
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Settings (if needed)
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8080"]
```

#### 5. Run Database Migration
```bash
python -c "
import asyncio
import sys
sys.path.append('app/backend')
from core.db import engine, Base

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Database tables created successfully!')

asyncio.run(create_tables())
"
```

## Running the Application

### Docker Compose (Recommended)
```bash
cd app
docker-compose up -d
```

### Manual Development Mode
```bash
# Navigate to backend directory
cd app/backend

# Start the FastAPI development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
# Start with uvicorn workers
uvicorn app.backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the application is running, you can access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

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

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists: `CREATE DATABASE gym_db;`

2. **Module Import Errors**
   - Activate virtual environment
   - Install dependencies: `pip install -r requirements.txt`

3. **Authentication Issues**
   - Verify JWT secret key in `.env`
   - Check token expiration settings

4. **Database Schema Issues**
   - Run DDL.sql first: `psql -d gym_db -f DDL.sql`
   - Verify tables exist: `\dt` in psql

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

See `PROJECT_REPORT.md` for detailed design documentation.

---

## 📄 License

This project is for educational purposes as part of the Database Systems course (EGEN5208W) at Carleton University.

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
