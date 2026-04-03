# Health and Fitness Club Management System

A web-based application for managing health and fitness club operations, including member management, trainer scheduling, class enrollment, and equipment maintenance.

**Course**: EGEN5208W - Databases for Software Engineers  
**Institution**: Carleton University  
**Technologies**: PostgreSQL, FastAPI, React, SQLAlchemy, Docker Compose

---

## 📺 Video Demonstration

**Video Link**: [Watch Demo](https://drive.google.com/file/d/1_cWLrs1dNea3omdEmO-paZKeXOP6ixJ6/view?usp=drive_link)

The video demonstrates all 8 required operations:
- ✅ Member: User Registration, Profile Management, Health History, Dashboard
- ✅ Trainer: Set Availability, Schedule View
- ✅ Admin: Room Booking, Equipment Maintenance

---

## 🚀 Quick Start

### Prerequisites

- Docker Desktop
- Git

### Run with Docker Compose

```bash
# 1. Clone and navigate
git clone https://github.com/oscaroguledo/EGEN5208W-Databases-for-Soft-Engineers.git
cd EGEN5208W-Databases-for-Soft-Engineers/app

# 2. Start all services
docker compose up --build

# 3. Access the app
# Frontend:     http://localhost:5173
# API Docs:     http://localhost:8000/docs
# Database:     localhost:5432
```

On startup, Docker automatically:
- Creates the PostgreSQL database
- Runs `sql/DDL.sql` (schema: tables, views, triggers, indexes)
- Runs `sql/DML.sql` (sample data)
- Starts the FastAPI backend with hot reload
- Starts the Vite frontend dev server with hot reload

### Default Login Credentials

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@gym.com          | password123 |
| Trainer | trainer1@gym.com       | password123 |
| Trainer | trainer2@gym.com       | password123 |
| Member  | member1@gym.com        | password123 |
| Member  | member2@gym.com        | password123 |
| Member  | member3@gym.com        | password123 |

---

## 🏗️ Architecture

### Technology Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Frontend       | React 18, TypeScript, Vite, TailwindCSS         |
| Backend        | FastAPI, Python 3.9, SQLAlchemy (async), Pydantic |
| Database       | PostgreSQL 15, AsyncPG driver                   |
| Auth           | JWT (access + refresh tokens), bcrypt           |
| Containerization | Docker Compose                               |

### Project Structure

```
EGEN5208W-Databases-for-Soft-Engineers/
├── app/
│   ├── docker-compose.yml
│   ├── backend/
│   │   ├── core/               # Auth, config, DB, encryption, JWT, sessions
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── routes/             # FastAPI route handlers
│   │   ├── services/           # Business logic
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── tests/              # Pytest test suite
│   │   ├── main.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── frontend/
│       ├── src/
│       │   ├── apis/           # API client modules
│       │   ├── components/     # Reusable UI components
│       │   ├── pages/          # Page components (member, trainer, admin)
│       │   ├── data/           # TypeScript types
│       │   └── hooks/          # Custom React hooks
│       ├── Dockerfile
│       └── package.json
├── sql/
│   ├── DDL.sql                 # Schema (tables, views, triggers, indexes)
│   ├── DML.sql                 # Sample data
│   ├── dbdiagram.md            # ER diagram source
│   └── init.sh                 # Docker init script
└── docs/
    ├── ER_Diagram.pdf
    └── ER_Diagram.png
```

---

## 🗄️ Database Schema

### Tables (18 total)

| Category         | Tables                                                              |
|------------------|---------------------------------------------------------------------|
| Users            | `users`, `members`, `trainers`, `admin_staff`                       |
| Facility         | `rooms`, `equipments`                                               |
| Training         | `classes`, `training_sessions`, `enrollments`, `trainer_availability` |
| Health & Billing | `fitness_goals`, `health_metrics`, `subscriptions`, `member_subscriptions`, `payments` |

### Advanced Database Features
- **Views**: Optimized queries for dashboard, schedule, and equipment reporting
- **Triggers**: Business rule enforcement (no overlapping bookings, capacity limits, auto-timestamps)
- **Indexes**: 25+ indexes for query performance
- **Constraints**: Foreign keys, unique constraints, check constraints

---

## 📡 API Reference

Interactive docs available at `http://localhost:8000/docs` once running.

### Authentication
| Method | Endpoint         | Description                  |
|--------|------------------|------------------------------|
| POST   | /auth/login      | Login, returns JWT tokens    |
| POST   | /auth/logout     | Logout, clears session       |
| GET    | /auth/me         | Get current user             |
| POST   | /auth/refresh    | Refresh access token         |

### Members
| Method | Endpoint                        | Description                  |
|--------|---------------------------------|------------------------------|
| POST   | /members/register               | Register new member          |
| GET    | /members/me                     | Get own profile              |
| PUT    | /members/me                     | Update own profile           |
| POST   | /members/goals                  | Create/update fitness goals  |
| GET    | /members/goals/list             | List fitness goals           |
| GET    | /members/health-history         | Get health metrics           |
| POST   | /members/health-metrics         | Add health metric            |
| GET    | /members/dashboard              | Get dashboard data           |
| GET    | /members/classes/available      | List available classes       |
| POST   | /members/enroll-class/{id}      | Enroll in class              |
| DELETE | /members/enroll-class/{id}      | Cancel class enrollment      |
| POST   | /members/book-session           | Book personal training       |
| DELETE | /members/book-session/{id}      | Cancel training session      |
| GET    | /members/list                   | List all members (admin)     |

### Trainers
| Method | Endpoint                        | Description                  |
|--------|---------------------------------|------------------------------|
| POST   | /trainers/availability          | Set availability             |
| GET    | /trainers/availability          | Get own availability         |
| DELETE | /trainers/availability/{id}     | Remove availability slot     |
| GET    | /trainers/schedule              | View schedule                |
| GET    | /trainers/list                  | List all trainers            |

### Admin
| Method | Endpoint                            | Description                  |
|--------|-------------------------------------|------------------------------|
| GET    | /admin/rooms                        | List rooms                   |
| GET    | /admin/sessions/list                | List training sessions       |
| PUT    | /admin/sessions/{id}/room           | Assign room to session       |
| POST   | /admin/classes                      | Create group class           |
| PUT    | /admin/classes/{id}/room            | Assign room to class         |
| GET    | /admin/equipment                    | List equipment               |
| POST   | /admin/equipment                    | Create equipment             |
| PUT    | /admin/equipment/{id}               | Update equipment             |
| PUT    | /admin/equipment/{id}/status        | Update equipment status      |
| DELETE | /admin/equipment/{id}               | Delete equipment             |
| GET    | /admin/payments/list                | List payments                |

### Authentication Flow

The app uses JWT with access + refresh tokens:

```bash
# Login
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@gym.com", "password": "password123"}'

# Use access token
curl -X GET "http://localhost:8000/members/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🧪 Running Tests

```bash
# Run the full test suite inside the backend container
docker compose exec backend pytest

# Or run locally (requires venv with requirements installed)
cd app/backend
pytest
```

---

## 🔧 Troubleshooting

```bash
# View logs for a specific service
docker compose logs backend
docker compose logs postgres

# Restart a service
docker compose restart backend

# Rebuild after code changes
docker compose up --build backend

# Reset the database (WARNING: deletes all data)
docker compose down -v
docker compose up --build
```

---

## 📝 Design Decisions

- **UUID primary keys** across all tables for distributed-safe IDs
- **Role inheritance via shared PK**: `users` → `members` / `trainers` / `admin_staff` share the same UUID
- **JWT auth**: Access token (short-lived) + refresh token (long-lived) stored in localStorage
- **Async SQLAlchemy**: All DB operations are async for better concurrency under load
- **Simulated billing**: No real payment gateway (per project requirements)

---

## 🎓 Submission Checklist

- [ ] Video demonstration uploaded (max 15 min)
- [ ] Video link added to README
- [ ] All 8 operations demonstrated in video
- [ ] ER Diagram included (`docs/ER_Diagram.pdf`)
- [ ] Relational Schema included (`sql/dbdiagram.md`)
- [ ] DDL.sql executable on fresh PostgreSQL
- [ ] DML.sql populates test data successfully
- [ ] Application runs with `docker compose up`
