# Health and Fitness Club Management System

A comprehensive web-based application for managing health and fitness club operations, including member management, trainer scheduling, class enrollment, and equipment maintenance.

## Technology Stack

- **Backend**: FastAPI (Python 3.8+)
- **Database**: PostgreSQL 13+
- **Authentication**: JWT with bcrypt password hashing
- **ORM**: SQLAlchemy with async support
- **API Documentation**: OpenAPI/Swagger (auto-generated)

## Features

- **Member Management**: Registration, profile management, health tracking, fitness goals
- **Trainer Operations**: Availability scheduling, session management, schedule viewing
- **Administrative Functions**: Class creation, room booking, equipment maintenance
- **Role-Based Access Control**: Member, Trainer, and Admin roles with appropriate permissions
- **Database Features**: Views, triggers, and indexes for performance and data integrity

## Prerequisites

- Python 3.8 or higher
- PostgreSQL 13 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## Database Setup

### 1. Create Database
```sql
CREATE DATABASE gym_db;
CREATE USER gym_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gym_db TO gym_user;
```

### 2. Execute DDL Script
```bash
psql -d gym_db -U gym_user -f DDL.sql
```

### 3. Execute DML Script (Sample Data)
```bash
psql -d gym_db -U gym_user -f DML.sql
```

## Application Setup

### 1. Clone/Download the Project
```bash
# Navigate to the project directory
cd /path/to/EGEN5208W-Databases-for-Soft-Engineers/backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration
Create a `.env` file in the `backend` directory:

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

### 5. Run Database Migration
The application will automatically create tables on startup, but you can verify:

```bash
python -c "
import asyncio
from core.db import engine, Base

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Database tables created successfully!')

asyncio.run(create_tables())
"
```

## Running the Application

### Development Mode
```bash
# Start the FastAPI development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
# Start with uvicorn workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
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

## Contributing

1. Follow PEP 8 Python style guidelines
2. Add comments for complex business logic
3. Update API documentation for new endpoints
4. Test database changes with sample data
5. Verify all database constraints are enforced

## License

This project is for educational purposes as part of the Database Systems course.
