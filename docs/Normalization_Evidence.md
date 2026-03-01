# Normalization Evidence: Third Normal Form (3NF) Compliance

## Overview
This document provides evidence that the Health and Fitness Club Management System database schema satisfies Third Normal Form (3NF) requirements.

## 3NF Requirements Recap
A relation is in 3NF if:
1. It is in Second Normal Form (2NF)
2. No transitive dependencies exist (no non-prime attribute depends on another non-prime attribute)

## Schema Analysis by Table

### 1. Users Table
**Primary Key:** `id` (UUID)

**Attributes:**
- `id` (Prime attribute)
- `email` (Non-prime, directly dependent on PK)
- `password` (Non-prime, directly dependent on PK)
- `role` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)
- `updated_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes are directly dependent on the primary key
- No transitive dependencies
- No partial dependencies (single attribute PK)

### 2. Members Table
**Primary Key:** `id` (UUID)
**Foreign Key:** `id` → `users.id`

**Attributes:**
- `id` (Prime attribute)
- `full_name` (Non-prime, directly dependent on PK)
- `date_of_birth` (Non-prime, directly dependent on PK)
- `gender` (Non-prime, directly dependent on PK)
- `phone` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)
- `updated_at` (Non-prime, directly dependent on PK)
- `deleted_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the member's PK
- No transitive dependencies
- Proper separation from users table (1:1 relationship)

### 3. Trainers Table
**Primary Key:** `id` (UUID)
**Foreign Key:** `id` → `users.id`

**Attributes:**
- `id` (Prime attribute)
- `full_name` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)
- `updated_at` (Non-prime, directly dependent on PK)
- `deleted_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the trainer's PK
- No transitive dependencies
- Proper separation from users table (1:1 relationship)

### 4. Admin_Staff Table
**Primary Key:** `id` (UUID)
**Foreign Key:** `id` → `users.id`

**Attributes:**
- `id` (Prime attribute)
- `full_name` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)
- `updated_at` (Non-prime, directly dependent on PK)
- `deleted_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the admin's PK
- No transitive dependencies
- Proper separation from users table (1:1 relationship)

### 5. Rooms Table
**Primary Key:** `id` (UUID)

**Attributes:**
- `id` (Prime attribute)
- `name` (Non-prime, directly dependent on PK)
- `capacity` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)
- `updated_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the room's PK
- No transitive dependencies
- No partial dependencies

### 6. Equipments Table
**Primary Key:** `id` (UUID)
**Foreign Key:** `room_id` → `rooms.id`

**Attributes:**
- `id` (Prime attribute)
- `room_id` (Non-prime, directly dependent on PK)
- `equipment_name` (Non-prime, directly dependent on PK)
- `status` (Non-prime, directly dependent on PK)
- `maintenance_notes` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)
- `updated_at` (Non-prime, directly dependent on PK)
- `deleted_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the equipment's PK
- `room_id` is a foreign key, not a transitive dependency
- No transitive dependencies

### 7. Subscriptions Table
**Primary Key:** `id` (UUID)

**Attributes:**
- `id` (Prime attribute)
- `plan` (Non-prime, directly dependent on PK)
- `fee` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)
- `updated_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the subscription's PK
- No transitive dependencies
- Fee is not dependent on plan (different plans can have same fee)

### 8. Member_Subscriptions Table
**Primary Key:** `id` (UUID)
**Foreign Keys:** `member_id` → `members.id`, `subscription_id` → `subscriptions.id`

**Attributes:**
- `id` (Prime attribute)
- `member_id` (Non-prime, directly dependent on PK)
- `subscription_id` (Non-prime, directly dependent on PK)
- `start_date` (Non-prime, directly dependent on PK)
- `end_date` (Non-prime, directly dependent on PK)
- `status` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)
- `updated_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the relationship's PK
- Foreign keys reference other tables, not transitive dependencies
- No transitive dependencies

### 9. Fitness_Goals Table
**Primary Key:** `id` (UUID)
**Foreign Key:** `member_id` → `members.id`

**Attributes:**
- `id` (Prime attribute)
- `member_id` (Non-prime, directly dependent on PK)
- `description` (Non-prime, directly dependent on PK)
- `target_value` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)
- `updated_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the goal's PK
- No transitive dependencies
- Proper separation of member goals from member profile

### 10. Health_Metrics Table
**Primary Key:** `id` (UUID)
**Foreign Key:** `member_id` → `members.id`

**Attributes:**
- `id` (Prime attribute)
- `member_id` (Non-prime, directly dependent on PK)
- `metric_type` (Non-prime, directly dependent on PK)
- `metric_value` (Non-prime, directly dependent on PK)
- `recorded_at` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the metric's PK
- No transitive dependencies
- Proper separation of health data from member profile

### 11. Trainer_Availability Table
**Primary Key:** `id` (UUID)
**Foreign Key:** `trainer_id` → `trainers.id`

**Attributes:**
- `id` (Prime attribute)
- `trainer_id` (Non-prime, directly dependent on PK)
- `available_date` (Non-prime, directly dependent on PK)
- `start_at` (Non-prime, directly dependent on PK)
- `end_at` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the availability's PK
- No transitive dependencies
- Proper separation of availability from trainer profile

### 12. Classes Table
**Primary Key:** `id` (UUID)
**Foreign Keys:** `trainer_id` → `trainers.id`, `room_id` → `rooms.id`

**Attributes:**
- `id` (Prime attribute)
- `name` (Non-prime, directly dependent on PK)
- `trainer_id` (Non-prime, directly dependent on PK)
- `room_id` (Non-prime, directly dependent on PK)
- `class_date` (Non-prime, directly dependent on PK)
- `start_time` (Non-prime, directly dependent on PK)
- `end_time` (Non-prime, directly dependent on PK)
- `max_capacity` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)
- `deleted_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the class's PK
- Foreign keys reference other tables, not transitive dependencies
- No transitive dependencies

### 13. Enrollments Table (Junction Table)
**Primary Key:** `id` (UUID)
**Foreign Keys:** `member_id` → `members.id`, `class_id` → `classes.id`

**Attributes:**
- `id` (Prime attribute)
- `member_id` (Non-prime, directly dependent on PK)
- `class_id` (Non-prime, directly dependent on PK)
- `registered_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the enrollment's PK
- Proper many-to-many relationship implementation
- No transitive dependencies

### 14. Training_Sessions Table
**Primary Key:** `id` (UUID)
**Foreign Keys:** `trainer_id` → `trainers.id`, `member_id` → `members.id`, `room_id` → `rooms.id`

**Attributes:**
- `id` (Prime attribute)
- `trainer_id` (Non-prime, directly dependent on PK)
- `member_id` (Non-prime, directly dependent on PK)
- `room_id` (Non-prime, directly dependent on PK)
- `session_date` (Non-prime, directly dependent on PK)
- `start_time` (Non-prime, directly dependent on PK)
- `end_time` (Non-prime, directly dependent on PK)
- `status` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)
- `updated_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the session's PK
- Foreign keys reference other tables, not transitive dependencies
- No transitive dependencies

### 15. Payments Table
**Primary Key:** `id` (UUID)
**Foreign Keys:** `member_id` → `members.id`, `subscription_id` → `member_subscriptions.id`

**Attributes:**
- `id` (Prime attribute)
- `member_id` (Non-prime, directly dependent on PK)
- `subscription_id` (Non-prime, directly dependent on PK)
- `amount` (Non-prime, directly dependent on PK)
- `paid_at` (Non-prime, directly dependent on PK)
- `payment_method` (Non-prime, directly dependent on PK)
- `deleted_at` (Non-prime, directly dependent on PK)
- `status` (Non-prime, directly dependent on PK)
- `created_at` (Non-prime, directly dependent on PK)

**3NF Compliance:** ✅
- All non-prime attributes depend directly on the payment's PK
- Foreign keys reference other tables, not transitive dependencies
- No transitive dependencies

## Key Design Decisions Supporting 3NF

### 1. Elimination of Transitive Dependencies
- **User Role Separation:** Instead of storing role-specific attributes in the users table, separate tables (members, trainers, admin_staff) are created with 1:1 relationships
- **Health Data Separation:** Health metrics and fitness goals are stored in separate tables rather than embedding them in the members table
- **Training Data Separation:** Training sessions and class enrollments are separate from user profiles

### 2. Proper Foreign Key Usage
- All foreign keys reference primary keys of other tables
- Foreign keys are used to establish relationships, not to store derived data
- No calculated or derived attributes are stored

### 3. Atomic Attributes
- All attributes are atomic (indivisible)
- No multi-valued attributes (e.g., multiple phone numbers in one field)
- No repeating groups

### 4. Single-Purpose Tables
- Each table has a single, clear purpose
- No mixed concerns in any table
- Clear separation of entities and relationships

## Conclusion

The Health and Fitness Club Management System database schema fully satisfies Third Normal Form (3NF) requirements:

✅ **All tables are in 2NF** (no partial dependencies)
✅ **No transitive dependencies exist** (all non-prime attributes depend directly on primary keys)
✅ **Proper separation of concerns** with appropriate table design
✅ **Atomic attributes** throughout the schema
✅ **Appropriate use of foreign keys** for relationships without creating transitive dependencies

The schema demonstrates sound database design principles and will maintain data integrity while avoiding update, insertion, and deletion anomalies.