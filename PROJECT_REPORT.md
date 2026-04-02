# Project Report
## Health and Fitness Club Management System

**Course:** EGEN5208W Databases for Software Engineers  
**Instructor:** Abdelghny Orogat  
**Department:** Department of Systems and Computer Engineering  
**University:** Carleton University  
**Submission Date:** April 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Entity-Relationship Model](#2-entity-relationship-model)
3. [Relational Schema Design](#3-relational-schema-design)
4. [Normalization to 3NF](#4-normalization-to-3nf)
5. [Database Implementation](#5-database-implementation)
6. [Application Implementation](#6-application-implementation)
7. [Demonstration Video](#7-demonstration-video)
8. [Conclusion](#8-conclusion)

---

## 1. Project Overview

### 1.1 Project Objective

Design and implement a Health and Fitness Club Management System using PostgreSQL as the backend database. The system demonstrates sound database design, correct SQL usage, constraint enforcement, and role-based access control.

### 1.2 System Scope

The system manages:
- **Members** - Client profiles, health metrics, fitness goals
- **Trainers** - Staff availability, schedules, assigned sessions
- **Administrative Staff** - Class management, room booking, equipment maintenance

### 1.3 Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI (Python 3.9+) |
| Database | PostgreSQL 13+ |
| ORM | SQLAlchemy 2.0 (async) |
| Frontend | React + TypeScript |
| Authentication | JWT with bcrypt |

---

## 2. Entity-Relationship Model

### 2.1 ER Diagram

The ER diagram (included as `ER_Diagram.pdf`) represents the conceptual design with:

- **15 Entities:** Users, Members, Trainers, AdminStaff, Rooms, Equipments, Classes, Enrollments, TrainingSessions, TrainerAvailability, FitnessGoals, HealthMetrics, Subscriptions, MemberSubscriptions, Payments

- **15+ Relationships:** Including 2 many-to-many relationships:
  - Members ↔ Classes (via Enrollments junction table)
  - Members ↔ Trainers (via TrainingSessions junction table)

### 2.2 Entity Descriptions

**Core Entities:**

| Entity | Primary Key | Key Attributes | Purpose |
|--------|-------------|----------------|---------|
| Users | id (UUID) | email, password, role | Base authentication |
| Members | id (FK to Users) | full_name, date_of_birth, gender, phone | Member profiles |
| Trainers | id (FK to Users) | full_name | Trainer profiles |
| AdminStaff | id (FK to Users) | full_name | Admin profiles |
| Rooms | id (UUID) | name, capacity | Physical spaces |
| Equipments | id (UUID) | equipment_name, status, maintenance_notes | Equipment tracking |

**Scheduling Entities:**

| Entity | Primary Key | Key Attributes | Purpose |
|--------|-------------|----------------|---------|
| Classes | id (UUID) | name, trainer_id, room_id, class_date, start_time, end_time, max_capacity | Group fitness classes |
| TrainingSessions | id (UUID) | trainer_id, member_id, room_id, session_date, start_time, end_time, status | Personal training |
| Enrollments | id (UUID) | member_id, class_id, registered_at | Class registrations |
| TrainerAvailability | id (UUID) | trainer_id, available_date, start_at, end_at | Trainer schedules |

**Health & Billing Entities:**

| Entity | Primary Key | Key Attributes | Purpose |
|--------|-------------|----------------|---------|
| FitnessGoals | id (UUID) | member_id, description, target_value | Member objectives |
| HealthMetrics | id (UUID) | member_id, metric_type, metric_value, recorded_at | Health tracking |
| Subscriptions | id (UUID) | plan, fee | Membership plans |
| Payments | id (UUID) | member_id, subscription_id, amount, status | Billing records |

### 2.3 Relationship Cardinality

```
Users (1) ──────── (1) Members
Users (1) ──────── (1) Trainers
Users (1) ──────── (1) AdminStaff

Rooms (1) ──────── (M) Equipments
Rooms (1) ──────── (M) Classes
Rooms (1) ──────── (M) TrainingSessions

Trainers (1) ───── (M) Classes
Trainers (1) ───── (M) TrainingSessions
Trainers (1) ───── (M) TrainerAvailability

Members (1) ────── (M) FitnessGoals
Members (1) ────── (M) HealthMetrics
Members (1) ────── (M) TrainingSessions
Members (1) ────── (M) MemberSubscriptions

Members (M) ────── (N) Classes (via Enrollments)
```

---

## 3. Relational Schema Design

### 3.1 Schema Mapping from ER to Relations

All entities map directly to relational tables with appropriate:
- **Primary Keys:** UUIDs for all entities
- **Foreign Keys:** Proper referential integrity
- **Constraints:** NOT NULL, UNIQUE, CHECK, DEFAULT

### 3.2 Key Design Decisions

**Inheritance Strategy:**
- Users, Members, Trainers, AdminStaff use a shared primary key pattern
- Members.id = Trainers.id = AdminStaff.id = Users.id
- This enforces that a user can only have one role

**Junction Tables:**
- `Enrollments` manages the many-to-many relationship between Members and Classes
- Includes unique constraint on (member_id, class_id) to prevent duplicates

**Soft Deletes:**
- Most tables include `deleted_at` timestamp for soft deletion
- Preserves historical data integrity

---

## 4. Normalization to 3NF

### 4.1 First Normal Form (1NF)

All tables satisfy 1NF:
- ✅ Atomic values in every cell
- ✅ No repeating groups
- ✅ Primary keys defined for all tables

**Example:** HealthMetrics table stores single metric per row (weight, heart_rate as separate entries)

### 4.2 Second Normal Form (2NF)

All tables satisfy 2NF:
- ✅ All non-key attributes fully dependent on primary key
- ✅ No partial dependencies
- ✅ Composite keys properly handled

**Example:** Classes table attributes depend only on class_id, not on parts of any composite key

### 4.3 Third Normal Form (3NF)

All tables satisfy 3NF:
- ✅ No transitive dependencies
- ✅ Non-key attributes depend only on primary key

**Evidence of 3NF:**

| Table | Non-Key Attributes | Dependency | 3NF Status |
|-------|-------------------|------------|------------|
| Users | email, password, role | Only on id | ✅ |
| Members | full_name, phone | Only on id (not on email) | ✅ |
| Classes | name, date, time | Only on class_id | ✅ |
| Equipments | name, status, notes | Only on equipment_id | ✅ |

**Separation of Concerns:**
- User authentication data in `Users` table
- Member profile data in `Members` table
- Health data in `HealthMetrics` table (not embedded in Members)
- This prevents data redundancy and update anomalies

---

## 5. Database Implementation

### 5.1 DDL.sql Structure

The `DDL.sql` file creates:

**Tables:** 15 tables with proper constraints
**Enums:** 6 custom types for status fields
**Indexes:** 25+ performance indexes
**Views:** 3 complex views
**Triggers:** 11+ business rule triggers

### 5.2 Database Views

View 1: `member_dashboard_view`
```sql
CREATE VIEW member_dashboard_view AS
SELECT 
    m.id as member_id,
    m.full_name,
    m.email,
    hm.metric_type,
    hm.metric_value,
    hm.recorded_at,
    fg.description as goal_description,
    COUNT(DISTINCT e.class_id) as total_classes_attended,
    ts.session_date,
    ts.start_time,
    ts.end_time,
    t.full_name as trainer_name
FROM members m
LEFT JOIN users u ON m.id = u.id
LEFT JOIN health_metrics hm ON m.id = hm.member_id
LEFT JOIN fitness_goals fg ON m.id = fg.member_id  
LEFT JOIN enrollments e ON m.id = e.member_id
LEFT JOIN training_sessions ts ON m.id = ts.member_id
LEFT JOIN trainers t ON ts.trainer_id = t.id
WHERE m.deleted_at IS NULL
GROUP BY m.id, m.full_name, m.email, hm.metric_type, 
         hm.metric_value, hm.recorded_at, fg.description,
         ts.session_date, ts.start_time, ts.end_time, t.full_name;
```

**Purpose:** Combines data from 6+ tables for the member dashboard display

View 2: `trainer_schedule_view`
```sql
CREATE VIEW trainer_schedule_view AS
SELECT 
    t.id as trainer_id,
    t.full_name as trainer_name,
    ts.session_date,
    ts.start_time,
    ts.end_time,
    m.full_name as member_name,
    r.name as room_name,
    'Personal Training' as session_type
FROM trainers t
LEFT JOIN training_sessions ts ON t.id = ts.trainer_id
LEFT JOIN members m ON ts.member_id = m.id
LEFT JOIN rooms r ON ts.room_id = r.id
WHERE t.deleted_at IS NULL
AND ts.session_date >= CURRENT_DATE
AND ts.status IN ('scheduled', 'completed')

UNION ALL

SELECT 
    t.id as trainer_id,
    t.full_name as trainer_name,
    c.class_date as session_date,
    c.start_time,
    c.end_time,
    NULL as member_name,
    r.name as room_name,
    c.name as session_type
FROM trainers t
LEFT JOIN classes c ON t.id = c.trainer_id
LEFT JOIN rooms r ON c.room_id = r.id
WHERE t.deleted_at IS NULL
AND c.class_date >= CURRENT_DATE;
```

View 3: `equipment_maintenance_view`
```sql
CREATE VIEW equipment_maintenance_view AS
SELECT 
    e.id as equipment_id,
    e.equipment_name,
    e.status,
    e.maintenance_notes,
    r.name as room_name,
    CASE 
        WHEN e.status = 'under_repair' THEN 'Requires Maintenance'
        WHEN e.status = 'out_of_service' THEN 'Out of Service'
        ELSE 'Operational'
    END as maintenance_status
FROM equipments e
LEFT JOIN rooms r ON e.room_id = r.id
WHERE e.deleted_at IS NULL
ORDER BY e.status, r.name, e.equipment_name;
```

### 5.3 Database Triggers

Trigger 1: Prevent Overlapping Bookings
```sql
CREATE OR REPLACE FUNCTION prevent_overlapping_bookings()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for member overlapping booking
    IF EXISTS (
        SELECT 1 FROM training_sessions ts
        WHERE ts.member_id = NEW.member_id
        AND ts.session_date = NEW.session_date
        AND ts.status IN ('scheduled', 'completed')
        AND ts.id != NEW.id
        AND (
            (ts.start_time <= NEW.start_time AND ts.end_time > NEW.start_time) OR
            (ts.start_time < NEW.end_time AND ts.end_time >= NEW.end_time) OR
            (ts.start_time >= NEW.start_time AND ts.end_time <= NEW.end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Member has overlapping booking';
    END IF;
    
    -- Similar checks for trainer and room...
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_overlapping_bookings
    BEFORE INSERT OR UPDATE ON training_sessions
    FOR EACH ROW EXECUTE FUNCTION prevent_overlapping_bookings();
```

**Business Rule Enforced:** Members cannot have overlapping sessions

Trigger 2: Prevent Class Overbooking
```sql
CREATE OR REPLACE FUNCTION prevent_class_overbooking()
RETURNS TRIGGER AS $$
DECLARE
    current_enrollments INTEGER;
    class_capacity INTEGER;
BEGIN
    SELECT COUNT(e.id), c.max_capacity
    INTO current_enrollments, class_capacity
    FROM enrollments e
    JOIN classes c ON e.class_id = c.id
    WHERE e.class_id = NEW.class_id;
    
    IF current_enrollments >= class_capacity THEN
        RAISE EXCEPTION 'Class is full';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_class_overbooking
    BEFORE INSERT ON enrollments
    FOR EACH ROW EXECUTE FUNCTION prevent_class_overbooking();
```

**Business Rule Enforced:** Classes cannot exceed max_capacity

### 5.4 Database Indexes

**Performance Indexes (Non-PK):**

```sql
-- Health metrics queries
CREATE INDEX idx_health_metrics_member_id ON health_metrics(member_id);
CREATE INDEX idx_health_metrics_recorded_at ON health_metrics(recorded_at);

-- Trainer schedule queries
CREATE INDEX idx_training_sessions_trainer_id ON training_sessions(trainer_id);
CREATE INDEX idx_training_sessions_date ON training_sessions(session_date);

-- Room availability queries
CREATE INDEX idx_classes_room_id ON classes(room_id);
CREATE INDEX idx_classes_date ON classes(class_date);

-- Equipment maintenance queries
CREATE INDEX idx_equipments_status ON equipments(status);

-- Class enrollment queries
CREATE INDEX idx_enrollments_member_id ON enrollments(member_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
```

---

## 6. Application Implementation

### 6.1 Backend Architecture

```
app/backend/
├── core/           # Core application logic
│   ├── auth.py     # JWT authentication, role checking
│   ├── config.py   # Configuration settings
│   ├── db.py       # Database connection (async)
│   └── response.py # API response models
├── models/         # SQLAlchemy ORM models
├── routes/         # API route handlers
│   ├── auth.py     # Login/logout
│   ├── members.py  # Member operations (4 ops)
│   ├── trainers.py # Trainer operations (2 ops)
│   └── admin.py    # Admin operations (2 ops)
├── services/       # Business logic services
└── migrations/     # Database schema
```

### 6.2 API Endpoints by Operation

**Member Operations (4):**

| Operation | Method | Endpoint | SQL Action |
|-----------|--------|----------|------------|
| User Registration | POST | `/members/register` | INSERT INTO users, INSERT INTO members |
| Profile Management | PUT | `/members/me` | UPDATE members |
| Health History | GET | `/members/health-history` | SELECT FROM health_metrics |
| Dashboard | GET | `/members/dashboard` | SELECT with multiple JOINs |

**Trainer Operations (2):**

| Operation | Method | Endpoint | SQL Action |
|-----------|--------|----------|------------|
| Set Availability | POST | `/trainers/availability` | INSERT INTO trainer_availability |
| Schedule View | GET | `/trainers/schedule` | SELECT FROM trainer_schedule_view |

**Admin Operations (2):**

| Operation | Method | Endpoint | SQL Action |
|-----------|--------|----------|------------|
| Room Booking | PUT | `/admin/sessions/{id}/room` | UPDATE training_sessions |
| Equipment Maintenance | GET/PUT | `/admin/equipment` | SELECT/UPDATE equipments |

### 6.3 Role-Based Access Control

**Implementation:** `app/backend/core/auth.py`

```python
class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles
    
    async def __call__(self, credentials: HTTPAuthorizationCredentials):
        # Validate JWT token
        user = await get_user_from_token(credentials.credentials)
        
        # Check role authorization
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )
        return user

# Role-specific dependencies
require_member = RoleChecker([UserRole.member])
require_trainer = RoleChecker([UserRole.trainer])
require_admin = RoleChecker([UserRole.admin])
```

**Access Matrix:**

| Operation | Member | Trainer | Admin |
|-----------|--------|---------|-------|
| User Registration | ✅ | ❌ | ✅ |
| Profile Management | ✅ (own) | ❌ | ❌ |
| Health History | ✅ (own) | ✅ (assigned) | ❌ |
| Dashboard | ✅ (own) | ❌ | ❌ |
| Set Availability | ❌ | ✅ (own) | ❌ |
| Schedule View | ❌ | ✅ (own) | ✅ |
| Room Booking | ❌ | ❌ | ✅ |
| Equipment Maintenance | ❌ | ❌ | ✅ |

### 6.4 Frontend Implementation

**Page Structure:**

```
app/frontend/src/pages/
├── member/
│   ├── RegistrationPage.tsx    # Operation 1
│   ├── ProfilePage.tsx         # Operation 2
│   ├── HealthHistoryPage.tsx   # Operation 3
│   └── DashboardPage.tsx       # Operation 4
├── trainer/
│   ├── AvailabilityPage.tsx    # Operation 5
│   └── SchedulePage.tsx        # Operation 6
└── admin/
    ├── RoomBookingPage.tsx     # Operation 7
    └── EquipmentPage.tsx       # Operation 8
```

**Key Features:**
- Role-specific routing
- Form validation with error messages
- Loading states and skeleton screens
- Toast notifications for success/error feedback
- Pagination for list views
- Modal dialogs for confirmations

---

## 7. Demonstration Video

### 7.1 Video Link

**Video URL:** [Insert your YouTube/Google Drive link here]

**Video Duration:** ~12 minutes (under 15 min limit)

### 7.2 Video Content Outline

The demonstration video covers the following:

**Section 1: ER Model (2 minutes)**
- Show ER diagram
- Explain entities and relationships
- Highlight cardinality and many-to-many relationships

**Section 2: Relational Schema (2 minutes)**
- Show schema diagram
- Explain table structures
- Show primary and foreign keys

**Section 3: Database Implementation (2 minutes)**
- Show DDL.sql content
- Demonstrate views, triggers, and indexes
- Show database creation process

**Section 4: Operations Demonstration (6 minutes)**

*Member Operations:*
- User Registration (success + duplicate email failure)
- Profile Management (update profile + add health metric)
- Health History (view sorted health metrics)
- Dashboard (view combined data)

*Trainer Operations:*
- Set Availability (success + overlap failure)
- Schedule View (view upcoming sessions)

*Admin Operations:*
- Room Booking (success + conflict failure)
- Equipment Maintenance (view and update status)

**Section 5: Role-Based Access Control (1 minute)**
- Show login with different roles
- Demonstrate access restrictions
- Show error messages for unauthorized access

---

## 8. Conclusion

### 8.1 Summary

This project successfully implements a complete Health and Fitness Club Management System that:

✅ **Meets all 8 required operations** (4 Member + 2 Trainer + 2 Admin)  
✅ **Implements proper database design** with 15 entities, 15+ relationships  
✅ **Demonstrates advanced SQL features:** 3 views, 11+ triggers, 25+ indexes  
✅ **Enforces role-based access control** for 3 user types  
✅ **Maintains 3NF normalization** throughout the schema  
✅ **Uses PostgreSQL** as the database system  

### 8.2 Challenges Encountered

1. **Overlapping Time Logic:** Implementing conflict detection for bookings required careful SQL logic to handle time range overlaps
2. **Many-to-Many Relationships:** Designing junction tables (Enrollments) while maintaining referential integrity
3. **Role-Based Routing:** Ensuring frontend and backend role checks are synchronized

### 8.3 Future Enhancements

Potential extensions beyond project scope:
- Payment gateway integration
- Email notifications
- Mobile app development
- Analytics dashboard with charts
- Member attendance tracking with QR codes

---

## Appendix A: File Organization

```
EGEN5208W-Databases-for-Soft-Engineers/
├── README.md                          # Setup instructions
├── COMPLIANCE_REPORT.md               # Requirements verification
├── docs/
│   ├── ER_Diagram.pdf                   # ER diagram (Chen notation)
│   ├── Normalization_Evidence.md      # 3NF justification
│   └── PROJECT_REQUIREMENTS_VERIFICATION.md
├── sql/
│   ├── DDL.sql                          # Database schema (499 lines)
│   ├── DML.sql                          # Sample data (241 lines)
│   └── dbdiagram.md                     # Relational schema diagram
└── app/
    ├── backend/                         # FastAPI application
    │   ├── core/
    │   ├── models/
    │   ├── routes/
    │   ├── services/
    │   └── migrations/
    └── frontend/                        # React application
        └── src/
            ├── pages/
            │   ├── member/              # 4 member pages
            │   ├── trainer/             # 2 trainer pages
            │   └── admin/               # 2 admin pages
            └── components/
```

## Appendix B: Default Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gym.com | password123 |
| Trainer | trainer1@gym.com | password123 |
| Member | member1@gym.com | password123 |

---

**End of Report**
