-- Health and Fitness Club Management System
-- Data Manipulation Language (DML)
-- This script populates the database with sample data for testing all operations

-- Insert Sample Users
INSERT INTO users (email, password, role) VALUES
('admin@gym.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'admin'),
('trainer1@gym.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'trainer'),
('trainer2@gym.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'trainer'),
('member1@gym.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'member'),
('member2@gym.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'member'),
('member3@gym.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'member');

-- Insert Admin Staff
INSERT INTO admin_staff (id, full_name) VALUES
((SELECT id FROM users WHERE email = 'admin@gym.com'), 'System Administrator');

-- Insert Trainers
INSERT INTO trainers (id, full_name) VALUES
((SELECT id FROM users WHERE email = 'trainer1@gym.com'), 'John Smith'),
((SELECT id FROM users WHERE email = 'trainer2@gym.com'), 'Sarah Johnson');

-- Insert Members
INSERT INTO members (id, full_name, date_of_birth, gender, phone) VALUES
((SELECT id FROM users WHERE email = 'member1@gym.com'), 'Alice Wilson', '1990-01-15', 'female', '555-0101'),
((SELECT id FROM users WHERE email = 'member2@gym.com'), 'Bob Brown', '1985-06-20', 'male', '555-0102'),
((SELECT id FROM users WHERE email = 'member3@gym.com'), 'Carol Davis', '1992-03-10', 'female', '555-0103');

-- Insert Rooms
INSERT INTO rooms (name, capacity) VALUES
('Cardio Room', 20),
('Weight Room', 15),
('Studio A', 10),
('Studio B', 12),
('Pool Area', 25);

-- Insert Equipment
INSERT INTO equipments (room_id, equipment_name, status, maintenance_notes) VALUES
((SELECT id FROM rooms WHERE name = 'Cardio Room'), 'Treadmill 1', 'operational', NULL),
((SELECT id FROM rooms WHERE name = 'Cardio Room'), 'Elliptical 1', 'operational', NULL),
((SELECT id FROM rooms WHERE name = 'Cardio Room'), 'Stationary Bike 1', 'under_repair', 'Chain needs replacement'),
((SELECT id FROM rooms WHERE name = 'Weight Room'), 'Bench Press 1', 'operational', NULL),
((SELECT id FROM rooms WHERE name = 'Weight Room'), 'Squat Rack 1', 'operational', NULL),
((SELECT id FROM rooms WHERE name = 'Weight Room'), 'Dumbbell Set 1', 'out_of_service', 'Damaged handle'),
((SELECT id FROM rooms WHERE name = 'Studio A'), 'Yoga Mats Set 1', 'operational', NULL),
((SELECT id FROM rooms WHERE name = 'Studio B'), 'Pilates Reformer 1', 'operational', NULL);

-- Insert Subscription Plans
INSERT INTO subscriptions (plan, fee) VALUES
('Basic Monthly', 29.99),
('Premium Monthly', 49.99),
('Annual Basic', 299.99),
('Annual Premium', 499.99);

-- Insert Member Subscriptions
INSERT INTO member_subscriptions (member_id, subscription_id, start_date, end_date, status) VALUES
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), (SELECT id FROM subscriptions WHERE plan = 'Premium Monthly'), '2024-01-01', '2024-12-31', 'active'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), (SELECT id FROM subscriptions WHERE plan = 'Basic Monthly'), '2024-02-01', NULL, 'active'),
((SELECT id FROM members WHERE full_name = 'Carol Davis'), (SELECT id FROM subscriptions WHERE plan = 'Annual Premium'), '2024-01-15', '2025-01-14', 'active');

-- Insert Payments
INSERT INTO payments (member_id, subscription_id, amount, paid_at, payment_method, status) VALUES
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), (SELECT id FROM member_subscriptions WHERE member_id = (SELECT id FROM members WHERE full_name = 'Alice Wilson')), 49.99, '2024-01-01 09:00:00', 'credit_card', 'paid'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), (SELECT id FROM member_subscriptions WHERE member_id = (SELECT id FROM members WHERE full_name = 'Bob Brown')), 29.99, '2024-02-01 10:00:00', 'debit_card', 'paid'),
((SELECT id FROM members WHERE full_name = 'Carol Davis'), (SELECT id FROM member_subscriptions WHERE member_id = (SELECT id FROM members WHERE full_name = 'Carol Davis')), 499.99, '2024-01-15 11:00:00', 'bank_transfer', 'paid');

-- Insert Fitness Goals
INSERT INTO fitness_goals (member_id, description, target_value) VALUES
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), 'Lose 10 pounds', '150'),
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), 'Run 5K without stopping', '30 minutes'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), 'Build muscle mass', '180 lbs'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), 'Increase bench press', '200 lbs'),
((SELECT id FROM members WHERE full_name = 'Carol Davis'), 'Improve flexibility', 'Touch toes'),
((SELECT id FROM members WHERE full_name = 'Carol Davis'), 'Reduce body fat', '18%');

-- Insert Health Metrics for Members
INSERT INTO health_metrics (member_id, metric_type, metric_value, recorded_at) VALUES
-- Alice Wilson's health data
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), 'weight', 160.5, '2024-01-01 08:00:00'),
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), 'weight', 158.2, '2024-01-15 08:00:00'),
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), 'weight', 155.8, '2024-02-01 08:00:00'),
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), 'heart_rate', 72, '2024-01-01 08:05:00'),
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), 'heart_rate', 70, '2024-01-15 08:05:00'),
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), 'blood_pressure_systolic', 120, '2024-01-01 08:10:00'),
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), 'blood_pressure_diastolic', 80, '2024-01-01 08:10:00'),

-- Bob Brown's health data
((SELECT id FROM members WHERE full_name = 'Bob Brown'), 'weight', 175.3, '2024-02-01 09:00:00'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), 'weight', 178.1, '2024-02-15 09:00:00'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), 'weight', 180.5, '2024-03-01 09:00:00'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), 'heart_rate', 68, '2024-02-01 09:05:00'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), 'heart_rate', 65, '2024-02-15 09:05:00'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), 'muscle_mass', 45.2, '2024-02-01 09:10:00'),

-- Carol Davis's health data
((SELECT id FROM members WHERE full_name = 'Carol Davis'), 'weight', 135.7, '2024-01-15 07:30:00'),
((SELECT id FROM members WHERE full_name = 'Carol Davis'), 'weight', 134.2, '2024-02-01 07:30:00'),
((SELECT id FROM members WHERE full_name = 'Carol Davis'), 'weight', 132.8, '2024-02-15 07:30:00'),
((SELECT id FROM members WHERE full_name = 'Carol Davis'), 'body_fat_percentage', 22.5, '2024-01-15 07:35:00'),
((SELECT id FROM members WHERE full_name = 'Carol Davis'), 'body_fat_percentage', 21.8, '2024-02-01 07:35:00');

-- Insert Trainer Availability
INSERT INTO trainer_availability (trainer_id, available_date, start_at, end_at) VALUES
-- John Smith's availability
((SELECT id FROM trainers WHERE full_name = 'John Smith'), '2024-03-01', '08:00:00', '12:00:00'),
((SELECT id FROM trainers WHERE full_name = 'John Smith'), '2024-03-01', '14:00:00', '18:00:00'),
((SELECT id FROM trainers WHERE full_name = 'John Smith'), '2024-03-02', '09:00:00', '13:00:00'),
((SELECT id FROM trainers WHERE full_name = 'John Smith'), '2024-03-03', '10:00:00', '14:00:00'),
((SELECT id FROM trainers WHERE full_name = 'John Smith'), '2024-03-04', '08:00:00', '12:00:00'),

-- Sarah Johnson's availability
((SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), '2024-03-01', '10:00:00', '14:00:00'),
((SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), '2024-03-01', '16:00:00', '20:00:00'),
((SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), '2024-03-02', '08:00:00', '12:00:00'),
((SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), '2024-03-03', '14:00:00', '18:00:00'),
((SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), '2024-03-05', '09:00:00', '13:00:00');

-- Insert Classes
INSERT INTO classes (name, trainer_id, room_id, class_date, start_time, end_time, max_capacity) VALUES
('Yoga Basics', (SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), (SELECT id FROM rooms WHERE name = 'Studio A'), '2024-03-01', '09:00:00', '10:00:00', 10),
('HIIT Training', (SELECT id FROM trainers WHERE full_name = 'John Smith'), (SELECT id FROM rooms WHERE name = 'Studio B'), '2024-03-01', '11:00:00', '12:00:00', 12),
('Pilates', (SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), (SELECT id FROM rooms WHERE name = 'Studio A'), '2024-03-02', '08:00:00', '09:00:00', 10),
('Strength Training', (SELECT id FROM trainers WHERE full_name = 'John Smith'), (SELECT id FROM rooms WHERE name = 'Weight Room'), '2024-03-02', '10:00:00', '11:00:00', 15),
('Cardio Blast', (SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), (SELECT id FROM rooms WHERE name = 'Cardio Room'), '2024-03-03', '07:00:00', '08:00:00', 20),
('Boxing Fitness', (SELECT id FROM trainers WHERE full_name = 'John Smith'), (SELECT id FROM rooms WHERE name = 'Studio B'), '2024-03-03', '14:00:00', '15:00:00', 12),
('Spinning Class', (SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), (SELECT id FROM rooms WHERE name = 'Cardio Room'), '2024-03-04', '06:00:00', '07:00:00', 15),
('CrossFit', (SELECT id FROM trainers WHERE full_name = 'John Smith'), (SELECT id FROM rooms WHERE name = 'Weight Room'), '2024-03-04', '17:00:00', '18:00:00', 20);

-- Insert Class Enrollments (some classes full, some with space)
INSERT INTO enrollments (member_id, class_id, registered_at) VALUES
-- Alice Wilson's enrollments
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), (SELECT id FROM classes WHERE name = 'Yoga Basics' AND class_date = '2024-03-01'), '2024-02-25 10:00:00'),
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), (SELECT id FROM classes WHERE name = 'HIIT Training' AND class_date = '2024-03-01'), '2024-02-25 10:01:00'),
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), (SELECT id FROM classes WHERE name = 'Pilates' AND class_date = '2024-03-02'), '2024-02-25 10:02:00'),

-- Bob Brown's enrollments
((SELECT id FROM members WHERE full_name = 'Bob Brown'), (SELECT id FROM classes WHERE name = 'Strength Training' AND class_date = '2024-03-02'), '2024-02-26 11:00:00'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), (SELECT id FROM classes WHERE name = 'Cardio Blast' AND class_date = '2024-03-03'), '2024-02-26 11:01:00'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), (SELECT id FROM classes WHERE name = 'Boxing Fitness' AND class_date = '2024-03-03'), '2024-02-26 11:02:00'),

-- Carol Davis's enrollments
((SELECT id FROM members WHERE full_name = 'Carol Davis'), (SELECT id FROM classes WHERE name = 'Yoga Basics' AND class_date = '2024-03-01'), '2024-02-27 14:00:00'),
((SELECT id FROM members WHERE full_name = 'Carol Davis'), (SELECT id FROM classes WHERE name = 'Spinning Class' AND class_date = '2024-03-04'), '2024-02-27 14:01:00'),

-- Fill some classes to capacity for testing (HIIT Training - capacity 12, add 10 more members)
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), (SELECT id FROM classes WHERE name = 'HIIT Training' AND class_date = '2024-03-01'), '2024-02-25 10:01:00'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), (SELECT id FROM classes WHERE name = 'HIIT Training' AND class_date = '2024-03-01'), '2024-02-26 11:00:00');

-- Insert Training Sessions
INSERT INTO training_sessions (trainer_id, member_id, room_id, session_date, start_time, end_time, status) VALUES
-- Alice Wilson's sessions
((SELECT id FROM trainers WHERE full_name = 'John Smith'), (SELECT id FROM members WHERE full_name = 'Alice Wilson'), (SELECT id FROM rooms WHERE name = 'Weight Room'), '2024-03-01', '13:00:00', '14:00:00', 'scheduled'),
((SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), (SELECT id FROM members WHERE full_name = 'Alice Wilson'), (SELECT id FROM rooms WHERE name = 'Studio A'), '2024-03-03', '11:00:00', '12:00:00', 'scheduled'),
((SELECT id FROM trainers WHERE full_name = 'John Smith'), (SELECT id FROM members WHERE full_name = 'Alice Wilson'), (SELECT id FROM rooms WHERE name = 'Studio B'), '2024-03-05', '15:00:00', '16:00:00', 'scheduled'),

-- Bob Brown's sessions
((SELECT id FROM trainers WHERE full_name = 'John Smith'), (SELECT id FROM members WHERE full_name = 'Bob Brown'), (SELECT id FROM rooms WHERE name = 'Weight Room'), '2024-03-02', '13:00:00', '14:00:00', 'scheduled'),
((SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), (SELECT id FROM members WHERE full_name = 'Bob Brown'), (SELECT id FROM rooms WHERE name = 'Studio B'), '2024-03-04', '13:00:00', '14:00:00', 'scheduled'),

-- Carol Davis's sessions
((SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), (SELECT id FROM members WHERE full_name = 'Carol Davis'), (SELECT id FROM rooms WHERE name = 'Studio A'), '2024-03-01', '15:00:00', '16:00:00', 'scheduled'),
((SELECT id FROM trainers WHERE full_name = 'John Smith'), (SELECT id FROM members WHERE full_name = 'Carol Davis'), (SELECT id FROM rooms WHERE name = 'Cardio Room'), '2024-03-04', '09:00:00', '10:00:00', 'scheduled');

-- Insert some completed sessions for testing dashboard
INSERT INTO training_sessions (trainer_id, member_id, room_id, session_date, start_time, end_time, status) VALUES
((SELECT id FROM trainers WHERE full_name = 'John Smith'), (SELECT id FROM members WHERE full_name = 'Alice Wilson'), (SELECT id FROM rooms WHERE name = 'Weight Room'), '2024-02-15', '13:00:00', '14:00:00', 'completed'),
((SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), (SELECT id FROM members WHERE full_name = 'Bob Brown'), (SELECT id FROM rooms WHERE name = 'Studio A'), '2024-02-16', '10:00:00', '11:00:00', 'completed'),
((SELECT id FROM trainers WHERE full_name = 'John Smith'), (SELECT id FROM members WHERE full_name = 'Carol Davis'), (SELECT id FROM rooms WHERE name = 'Studio B'), '2024-02-17', '15:00:00', '16:00:00', 'completed');

-- Insert some past classes for testing history
INSERT INTO classes (name, trainer_id, room_id, class_date, start_time, end_time, max_capacity, created_at, deleted_at) VALUES
('Past Yoga Class', (SELECT id FROM trainers WHERE full_name = 'Sarah Johnson'), (SELECT id FROM rooms WHERE name = 'Studio A'), '2024-02-10', '09:00:00', '10:00:00', 10, '2024-02-01 08:00:00', '2024-02-10 10:01:00'),
('Past HIIT Class', (SELECT id FROM trainers WHERE full_name = 'John Smith'), (SELECT id FROM rooms WHERE name = 'Studio B'), '2024-02-12', '11:00:00', '12:00:00', 12, '2024-02-01 08:00:00', '2024-02-12 12:01:00');

-- Insert enrollments for past classes
INSERT INTO enrollments (member_id, class_id, registered_at) VALUES
((SELECT id FROM members WHERE full_name = 'Alice Wilson'), (SELECT id FROM classes WHERE name = 'Past Yoga Class' AND class_date = '2024-02-10'), '2024-02-05 10:00:00'),
((SELECT id FROM members WHERE full_name = 'Bob Brown'), (SELECT id FROM classes WHERE name = 'Past Yoga Class' AND class_date = '2024-02-10'), '2024-02-05 10:01:00'),
((SELECT id FROM members WHERE full_name = 'Carol Davis'), (SELECT id FROM classes WHERE name = 'Past HIIT Class' AND class_date = '2024-02-12'), '2024-02-07 11:00:00');

-- Data Verification Queries
SELECT 'Sample Data Insertion Complete!' as status;

-- Show summary of inserted data
SELECT 'Users:' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Members:', COUNT(*) FROM members
UNION ALL
SELECT 'Trainers:', COUNT(*) FROM trainers
UNION ALL
SELECT 'Admin Staff:', COUNT(*) FROM admin_staff
UNION ALL
SELECT 'Rooms:', COUNT(*) FROM rooms
UNION ALL
SELECT 'Equipment:', COUNT(*) FROM equipments
UNION ALL
SELECT 'Subscriptions:', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'Member Subscriptions:', COUNT(*) FROM member_subscriptions
UNION ALL
SELECT 'Payments:', COUNT(*) FROM payments
UNION ALL
SELECT 'Fitness Goals:', COUNT(*) FROM fitness_goals
UNION ALL
SELECT 'Health Metrics:', COUNT(*) FROM health_metrics
UNION ALL
SELECT 'Trainer Availability:', COUNT(*) FROM trainer_availability
UNION ALL
SELECT 'Classes:', COUNT(*) FROM classes
UNION ALL
SELECT 'Enrollments:', COUNT(*) FROM enrollments
UNION ALL
SELECT 'Training Sessions:', COUNT(*) FROM training_sessions;

-- Test Data for All 8 Operations:

-- Operation 1: User Registration - Test with new member email
-- (Test: Try to register new member with email 'newmember@gym.com')

-- Operation 2: Profile Management - Test with existing member
-- (Test: Update Alice Wilson's profile or goals)

-- Operation 3: Health History - Test with Alice Wilson's metrics
-- (Test: View Alice Wilson's health history)

-- Operation 4: Dashboard - Test with any member
-- (Test: View Alice Wilson's dashboard showing goals, metrics, sessions, classes)

-- Operation 5: Set Availability - Test with trainer
-- (Test: Set John Smith's availability for new dates)

-- Operation 6: Schedule View - Test with trainer
-- (Test: View John Smith's upcoming schedule)

-- Operation 7: Room Booking - Test with admin
-- (Test: Assign room to training session or check conflicts)

-- Operation 8: Equipment Maintenance - Test with admin
-- (Test: Update equipment status or view maintenance needs)

SELECT 'Test Data Ready for All 8 Operations!' as status;