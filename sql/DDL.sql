-- Health and Fitness Club Management System
-- Database Definition Language (DDL)
-- This script creates the complete database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'trainer', 'member');
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE equipment_status AS ENUM ('operational', 'under_repair', 'out_of_service');
CREATE TYPE session_status AS ENUM ('scheduled', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'suspended');

-- Create Tables

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Members Table
CREATE TABLE members (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Trainers Table
CREATE TABLE trainers (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Admin Staff Table
CREATE TABLE admin_staff (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Subscriptions Table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan VARCHAR(255) NOT NULL,
    fee DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Member Subscriptions Table
CREATE TABLE member_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE,
    status subscription_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fitness Goals Table
CREATE TABLE fitness_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    target_value VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Health Metrics Table
CREATE TABLE health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Rooms Table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Equipments Table
CREATE TABLE equipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    equipment_name VARCHAR(255) NOT NULL,
    status equipment_status NOT NULL DEFAULT 'operational',
    maintenance_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Trainer Availability Table
CREATE TABLE trainer_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    available_date DATE NOT NULL,
    start_at TIME NOT NULL,
    end_at TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Classes Table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    class_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enrollments Table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Training Sessions Table
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status session_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES member_subscriptions(id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status payment_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance

-- Users and Roles
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_deleted_at ON members(deleted_at);
CREATE INDEX idx_trainers_deleted_at ON trainers(deleted_at);
CREATE INDEX idx_admins_deleted_at ON admin_staff(deleted_at);

-- Subscriptions and Payments
CREATE INDEX idx_member_subscriptions_member_id ON member_subscriptions(member_id);
CREATE INDEX idx_member_subscriptions_status ON member_subscriptions(status);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

-- Health and Fitness
CREATE INDEX idx_fitness_goals_member_id ON fitness_goals(member_id);
CREATE INDEX idx_fitness_goals_member_created ON fitness_goals(member_id, created_at);
CREATE INDEX idx_health_metrics_member_id ON health_metrics(member_id);
CREATE INDEX idx_health_metrics_recorded_at ON health_metrics(recorded_at);
CREATE INDEX idx_health_metrics_member_recorded ON health_metrics(member_id, recorded_at);
CREATE INDEX idx_health_metrics_type ON health_metrics(metric_type);

-- Training and Availability
CREATE INDEX idx_trainer_availability_trainer_id ON trainer_availability(trainer_id);
CREATE INDEX idx_trainer_availability_date ON trainer_availability(available_date);
CREATE INDEX idx_trainer_availability_trainer_date ON trainer_availability(trainer_id, available_date, start_at, end_at);

-- Classes and Enrollments
CREATE INDEX idx_classes_trainer_id ON classes(trainer_id);
CREATE INDEX idx_classes_room_id ON classes(room_id);
CREATE INDEX idx_classes_date ON classes(class_date);
CREATE INDEX idx_classes_deleted_at ON classes(deleted_at);
CREATE INDEX idx_classes_trainer_date_time ON classes(trainer_id, class_date, start_time);
CREATE INDEX idx_classes_room_date_time ON classes(room_id, class_date, start_time);
CREATE INDEX idx_enrollments_member_id ON enrollments(member_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX idx_enrollments_class_member ON enrollments(class_id, member_id);

-- Training Sessions
CREATE INDEX idx_training_sessions_trainer_id ON training_sessions(trainer_id);
CREATE INDEX idx_training_sessions_member_id ON training_sessions(member_id);
CREATE INDEX idx_training_sessions_room_id ON training_sessions(room_id);
CREATE INDEX idx_training_sessions_date ON training_sessions(session_date);
CREATE INDEX idx_training_sessions_status ON training_sessions(status);
CREATE INDEX idx_training_sessions_trainer_date_time ON training_sessions(trainer_id, session_date, start_time);
CREATE INDEX idx_training_sessions_room_date_time ON training_sessions(room_id, session_date, start_time);
CREATE INDEX idx_training_sessions_member_date ON training_sessions(member_id, session_date);

-- Equipment
CREATE INDEX idx_equipments_room_id ON equipments(room_id);
CREATE INDEX idx_equipments_status ON equipments(status);
CREATE INDEX idx_equipments_deleted_at ON equipments(deleted_at);

-- Create Unique Constraints
ALTER TABLE enrollments ADD CONSTRAINT enrollments_class_member_unique UNIQUE (class_id, member_id);

-- Create Database Views

-- Member Dashboard View
CREATE VIEW member_dashboard_view AS
SELECT 
    m.id as member_id,
    m.full_name,
    u.email,
    hm.metric_type,
    hm.metric_value,
    hm.recorded_at,
    fg.description as goal_description,
    fg.target_value as goal_target,
    COUNT(DISTINCT e.class_id) as total_classes_attended,
    ts.session_date,
    ts.start_time,
    ts.end_time,
    t.full_name as trainer_name,
    r.name as room_name,
    c.name as class_name,
    c.class_date,
    c.start_time as class_start_time,
    c.end_time as class_end_time
FROM members m
LEFT JOIN users u ON m.id = u.id
LEFT JOIN health_metrics hm ON m.id = hm.member_id
LEFT JOIN fitness_goals fg ON m.id = fg.member_id  
LEFT JOIN enrollments e ON m.id = e.member_id
LEFT JOIN classes c ON e.class_id = c.id
LEFT JOIN training_sessions ts ON m.id = ts.member_id
LEFT JOIN trainers t ON ts.trainer_id = t.id
LEFT JOIN rooms r ON ts.room_id = r.id
WHERE m.deleted_at IS NULL
GROUP BY m.id, m.full_name, u.email, hm.metric_type, hm.metric_value, hm.recorded_at, 
         fg.description, fg.target_value, ts.session_date, ts.start_time, ts.end_time, 
         t.full_name, r.name, c.name, c.class_date, c.start_time, c.end_time;

-- Trainer Schedule View
CREATE VIEW trainer_schedule_view AS
SELECT 
    t.id as trainer_id,
    t.full_name as trainer_name,
    ts.session_date,
    ts.start_time,
    ts.end_time,
    m.full_name as member_name,
    r.name as room_name,
    'Personal Training' as session_type,
    ts.status
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
    c.name as session_type,
    'scheduled' as status
FROM trainers t
LEFT JOIN classes c ON t.id = c.trainer_id
LEFT JOIN rooms r ON c.room_id = r.id
WHERE t.deleted_at IS NULL
AND c.class_date >= CURRENT_DATE
AND c.deleted_at IS NULL
ORDER BY session_date, start_time;

-- Equipment Maintenance View
CREATE VIEW equipment_maintenance_view AS
SELECT 
    e.id as equipment_id,
    e.equipment_name,
    e.status,
    e.maintenance_notes,
    e.updated_at,
    r.name as room_name,
    r.capacity as room_capacity,
    CASE 
        WHEN e.status = 'under_repair' THEN 'Requires Maintenance'
        WHEN e.status = 'out_of_service' THEN 'Out of Service'
        ELSE 'Operational'
    END as maintenance_status
FROM equipments e
LEFT JOIN rooms r ON e.room_id = r.id
WHERE e.deleted_at IS NULL
ORDER BY 
    CASE 
        WHEN e.status = 'under_repair' THEN 1
        WHEN e.status = 'out_of_service' THEN 2
        ELSE 3
    END,
    r.name, e.equipment_name;

-- Create Database Triggers

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_trainers_updated_at
    BEFORE UPDATE ON trainers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_admin_staff_updated_at
    BEFORE UPDATE ON admin_staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_equipments_updated_at
    BEFORE UPDATE ON equipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_member_subscriptions_updated_at
    BEFORE UPDATE ON member_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_fitness_goals_updated_at
    BEFORE UPDATE ON fitness_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_training_sessions_updated_at
    BEFORE UPDATE ON training_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to prevent overlapping bookings
CREATE OR REPLACE FUNCTION prevent_overlapping_bookings()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping training sessions for the same member
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
    
    -- Check for trainer availability conflicts
    IF EXISTS (
        SELECT 1 FROM training_sessions ts
        WHERE ts.trainer_id = NEW.trainer_id
        AND ts.session_date = NEW.session_date
        AND ts.status IN ('scheduled', 'completed')
        AND ts.id != NEW.id
        AND (
            (ts.start_time <= NEW.start_time AND ts.end_time > NEW.start_time) OR
            (ts.start_time < NEW.end_time AND ts.end_time >= NEW.end_time) OR
            (ts.start_time >= NEW.start_time AND ts.end_time <= NEW.end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Trainer is not available at this time';
    END IF;
    
    -- Check for room conflicts
    IF EXISTS (
        SELECT 1 FROM training_sessions ts
        WHERE ts.room_id = NEW.room_id
        AND ts.session_date = NEW.session_date
        AND ts.status IN ('scheduled', 'completed')
        AND ts.id != NEW.id
        AND (
            (ts.start_time <= NEW.start_time AND ts.end_time > NEW.start_time) OR
            (ts.start_time < NEW.end_time AND ts.end_time >= NEW.end_time) OR
            (ts.start_time >= NEW.start_time AND ts.end_time <= NEW.end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Room is not available at this time';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_overlapping_bookings
    BEFORE INSERT OR UPDATE ON training_sessions
    FOR EACH ROW EXECUTE FUNCTION prevent_overlapping_bookings();

-- Trigger to prevent class overbooking
CREATE OR REPLACE FUNCTION prevent_class_overbooking()
RETURNS TRIGGER AS $$
DECLARE
    current_enrollments INTEGER;
    class_capacity INTEGER;
BEGIN
    -- Get current enrollment count and class capacity
    SELECT COUNT(e.id), c.max_capacity
    INTO current_enrollments, class_capacity
    FROM enrollments e
    JOIN classes c ON e.class_id = c.id
    WHERE e.class_id = NEW.class_id;
    
    -- Check if adding this enrollment would exceed capacity
    IF current_enrollments >= class_capacity THEN
        RAISE EXCEPTION 'Class is already at maximum capacity';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_class_overbooking
    BEFORE INSERT ON enrollments
    FOR EACH ROW EXECUTE FUNCTION prevent_class_overbooking();

-- Create Comments for Documentation
COMMENT ON DATABASE IS 'Health and Fitness Club Management System';

COMMENT ON TABLE users IS 'Base user accounts with role-based access';
COMMENT ON TABLE members IS 'Member profiles and personal information';
COMMENT ON TABLE trainers IS 'Trainer profiles and availability';
COMMENT ON TABLE admin_staff IS 'Administrative staff profiles';
COMMENT ON TABLE rooms IS 'Physical training rooms and facilities';
COMMENT ON TABLE equipments IS 'Gym equipment and maintenance tracking';
COMMENT ON TABLE classes IS 'Group fitness classes';
COMMENT ON TABLE training_sessions IS 'Personal training sessions';
COMMENT ON TABLE enrollments IS 'Member class registrations';
COMMENT ON TABLE fitness_goals IS 'Member fitness objectives';
COMMENT ON TABLE health_metrics IS 'Member health tracking data';
COMMENT ON TABLE subscriptions IS 'Membership plans and pricing';
COMMENT ON TABLE member_subscriptions IS 'Member subscription relationships';
COMMENT ON TABLE payments IS 'Billing and payment records';
COMMENT ON TABLE trainer_availability IS 'Trainer time slot availability';

-- Completion Message
SELECT 'Health and Fitness Club Management System database created successfully!' as status;