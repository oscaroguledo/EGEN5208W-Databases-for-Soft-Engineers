// ============================================================================
// Health and Fitness Club Management System - Database Schema (DBML)
// ============================================================================
// 
// Course: EGEN5208W - Databases for Software Engineers
// Institution: Carleton University
// 
// HOW TO USE THIS FILE:
// 1. Go to https://dbdiagram.io
// 2. Create a new diagram
// 3. Paste this entire file into the editor
// 4. The tool will generate a visual relational schema diagram
//
// This DBML file represents the complete PostgreSQL database schema
// matching the DDL.sql file exactly. All tables, enums, relationships,
// and indexes are defined here for visual documentation.
//
// Database System: PostgreSQL 13+
// ORM: SQLAlchemy 2.0 (async)
// Normalization: Third Normal Form (3NF)
//
// ============================================================================

// Enums for status fields and constraints
Enum user_role {
  admin
  trainer
  member
}

Enum gender {
  male
  female
}

Enum subscription_status {
  active
  expired
  cancelled
  suspended
}

Enum session_status {
  scheduled
  cancelled
  completed
}

Enum equipment_status {
  operational
  under_repair
  out_of_service
}

Enum payment_status {
  pending
  paid
  failed
  refunded
}
// ============================================================================
// CORE USER MANAGEMENT
// ============================================================================
// Users table serves as the base authentication table with role-based access.
// Members, Trainers, and AdminStaff inherit from Users via shared PK (UUID).
// This implements role inheritance and ensures a user has only one role.
// ============================================================================

Table users {
  id uuid [primary key, note: 'Shared PK with role-specific tables']
  email varchar [not null, unique, note: 'Login credential, must be unique']
  password varchar [not null, note: 'Bcrypt hashed password']
  role user_role [not null, default: 'member', note: 'Role determines accessible operations']
  created_at timestamp [not null, default: `now()`, note: 'Account creation timestamp']
  updated_at timestamp [not null, default: `now()`, note: 'Last update timestamp']
}

// ============================================================================
// ROLE-SPECIFIC PROFILE TABLES (Inherit from users via id reference)
// ============================================================================

Table members {
  id uuid [primary key, ref: > users.id, note: 'FK to users.id - shared PK pattern']
  full_name varchar [not null, note: 'Member display name']
  date_of_birth date [not null, note: 'Used for age verification']
  gender gender [not null, note: 'Demographic information']
  phone varchar [not null, unique, note: 'Contact number, must be unique']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

Table trainers {
  id uuid [primary key, ref: > users.id, note: 'FK to users.id - shared PK pattern']
  full_name varchar [not null]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

Table admin_staff {
  id uuid [primary key, ref: > users.id, note: 'FK to users.id - shared PK pattern']
  full_name varchar [not null]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

// ============================================================================
// SUBSCRIPTION & BILLING MODULE
// ============================================================================

Table subscriptions {
  id uuid [primary key, note: 'Membership plan definition']
  plan varchar [not null, note: 'Plan name (e.g., Basic Monthly, Premium Annual)']
  fee decimal(10,2) [not null, note: 'Monthly/annual fee amount']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

Table member_subscriptions {
  id uuid [primary key, note: 'Junction table linking members to subscription plans']
  member_id uuid [not null, ref: > members.id, note: 'FK to member']
  subscription_id uuid [not null, ref: > subscriptions.id, note: 'FK to subscription plan']
  start_date date [not null, note: 'Subscription start date']
  end_date date [null, note: 'Subscription end date (null if ongoing)']
  status subscription_status [not null, default: 'active', note: 'Current subscription status']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}
// ============================================================================
// MEMBER HEALTH & FITNESS TRACKING
// ============================================================================

Table fitness_goals {
  id uuid [primary key, note: 'Member fitness objectives']
  member_id uuid [not null, ref: > members.id, note: 'FK to member who owns this goal']
  description text [not null, note: 'Goal description (e.g., Lose 10 pounds)']
  target_value varchar [null, note: 'Target metric (e.g., 150 lbs, 30 min)']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
  
  Indexes {
    (member_id, created_at) [name: 'idx_fitness_goals_member_created', note: 'Query goals by member, sorted by date']
  }
}

Table health_metrics {
  id uuid [primary key, note: 'Append-only health tracking records']
  member_id uuid [not null, ref: > members.id, note: 'FK to member']
  metric_type varchar [not null, note: 'Type: weight, heart_rate, blood_pressure, etc.']
  metric_value decimal(10,2) [not null, note: 'Numeric value of the metric']
  recorded_at timestamp [not null, note: 'When the measurement was taken']
  created_at timestamp [not null, default: `now()`, note: 'When record was inserted']
  
  Indexes {
    (member_id, recorded_at) [name: 'idx_health_metrics_member_recorded', note: 'Query health history by member, chronological order']
  }
}

// ============================================================================
// TRAINER AVAILABILITY & SCHEDULING
// ============================================================================

Table trainer_availability {
  id uuid [primary key, note: 'Trainer-defined available time slots']
  trainer_id uuid [not null, ref: > trainers.id, note: 'FK to trainer']
  available_date date [not null, note: 'Date of availability']
  start_at time [not null, note: 'Availability start time']
  end_at time [not null, note: 'Availability end time']
  created_at timestamp [not null, default: `now()`]
}

// ============================================================================
// FACILITY MANAGEMENT (Rooms & Equipment)
// ============================================================================

Table rooms  {
  id uuid [primary key, note: 'Physical training spaces']
  name varchar [not null, note: 'Room name (e.g., Studio A, Weight Room)']
  capacity int [not null, note: 'Maximum occupancy']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}
// ============================================================================
// GROUP FITNESS CLASSES
// ============================================================================

Table classes {
  id uuid [primary key, note: 'Group fitness class definition']
  name varchar [not null, note: 'Class name (e.g., Yoga Basics, HIIT Training)']
  trainer_id uuid [not null, ref: > trainers.id, note: 'FK to assigned trainer']
  room_id uuid [not null, ref: > rooms.id, note: 'FK to assigned room']
  class_date date [not null, note: 'Date of the class']
  start_time time [not null, note: 'Class start time']
  end_time time [not null, note: 'Class end time']
  max_capacity int [not null, default: 20, note: 'Maximum number of participants']
  created_at timestamp [not null, default: `now()`]
  
  Indexes {
    (trainer_id, class_date, start_time) [name: 'idx_classes_trainer_datetime', note: 'Query classes by trainer, sorted by date/time']
    (room_id, class_date, start_time) [name: 'idx_classes_room_datetime', note: 'Query classes by room, sorted by date/time - used for conflict detection']
  }
}

Table enrollments {
  id uuid [primary key, note: 'Junction table: Members <-> Classes (Many-to-Many relationship)']
  member_id uuid [not null, ref: > members.id, note: 'FK to enrolled member']
  class_id uuid [not null, ref: > classes.id, note: 'FK to class being enrolled']
  registered_at timestamp [not null, default: `now()`, note: 'When enrollment occurred']
  
  Indexes {
    (class_id, member_id) [unique, name: 'idx_enrollments_unique', note: 'Prevent duplicate enrollments - one per member per class']
  }
}

// ============================================================================
// PERSONAL TRAINING SESSIONS
// ============================================================================

Table training_sessions {
  id uuid [primary key, note: 'One-on-one training session bookings']
  trainer_id uuid [not null, ref: > trainers.id, note: 'FK to assigned trainer']
  member_id uuid [not null, ref: > members.id, note: 'FK to member receiving training']
  room_id uuid [not null, ref: > rooms.id, note: 'FK to booked room']

  session_date date [not null, note: 'Session date']
  start_time time [not null, note: 'Session start time']
  end_time time [not null, note: 'Session end time']

  status session_status [not null, default: 'scheduled', note: 'Current status: scheduled, completed, cancelled']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
  
  Indexes {
    (trainer_id, session_date, start_time) [name: 'idx_sessions_trainer_datetime', note: 'Query sessions by trainer - used for schedule view']
    (room_id, session_date, start_time) [name: 'idx_sessions_room_datetime', note: 'Query sessions by room - used for conflict detection']
    (member_id, session_date) [name: 'idx_sessions_member_date', note: 'Query sessions by member - used for dashboard']
  }
}

Table equipments {
  id uuid [primary key, note: 'Gym equipment inventory']
  room_id uuid [not null, ref: > rooms.id, note: 'FK to room where equipment is located']
  equipment_name varchar [not null, note: 'Equipment name (e.g., Treadmill #1)']
  status equipment_status [not null, default: 'operational', note: 'Current operational status']
  maintenance_notes text [null, note: 'Notes about repairs or maintenance issues']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

// ============================================================================
// BILLING & PAYMENTS
// ============================================================================
// Note: Billing is simulated only (no real payment gateway)
// as specified in project requirements.
// ============================================================================

Table payments {
  id uuid [primary key, note: 'Payment transaction records (simulated)']
  member_id uuid [not null, ref: > members.id, note: 'FK to paying member']
  subscription_id uuid [not null, ref: > member_subscriptions.id, note: 'FK to subscription being paid for']
  amount decimal(10,2) [not null, note: 'Payment amount']
  paid_at timestamp [not null, note: 'When payment was processed']
  payment_method varchar(100) [not null, note: 'Payment method description (e.g., credit_card, debit_card)']
  status payment_status [not null, default: 'pending', note: 'Payment status: pending, paid, failed, refunded']
  created_at timestamp [not null, default: `now()`]
  
  Indexes {
    (member_id) [name: 'idx_payments_member', note: 'Query payments by member']
    (paid_at) [name: 'idx_payments_date', note: 'Query payments by date range']
    (status) [name: 'idx_payments_status', note: 'Filter payments by status']
  }
}

// ============================================================================
// DATABASE FEATURES SUMMARY
// ============================================================================
// 
// VIEWS (3):
//   - member_dashboard_view: Combines 6+ tables for dashboard queries
//   - trainer_schedule_view: Personal sessions + group classes
//   - equipment_maintenance_view: Equipment status with room info
//
// TRIGGERS (11+):
//   - prevent_overlapping_bookings: Enforces no double-booking
//   - prevent_class_overbooking: Enforces class capacity limits
//   - *_updated_at: Auto-updates timestamps on modification
//
// INDEXES (20+):
//   - Non-primary key indexes for performance
//   - Covering indexes for frequent query patterns
//
// CONSTRAINTS:
//   - Foreign keys with CASCADE/RESTRICT
//   - UNIQUE constraints (email, phone, enrollments)
//   - CHECK constraints via ENUM types
//   - NOT NULL for required fields
//
// DELETION POLICY:
//   - Hard delete: Records are permanently removed when deleted
//   - ON DELETE CASCADE: Related records auto-deleted (e.g., user -> member)
//   - ON DELETE RESTRICT: Prevents deletion if dependencies exist
//
// ============================================================================
