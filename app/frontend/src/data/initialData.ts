import {
  User,
  Member,
  Trainer,
  Room,
  FitnessGoal,
  HealthMetric,
  TrainerAvailability,
  GroupClass,
  ClassRegistration,
  PersonalSession,
  Equipment } from
'./types';

export const INITIAL_USERS: User[] = [
{
  user_id: 1,
  username: 'alice@gym.com',
  password: 'password',
  role: 'member',
  created_at: '2024-01-10T09:00:00'
},
{
  user_id: 2,
  username: 'bob@gym.com',
  password: 'password',
  role: 'member',
  created_at: '2024-02-14T10:30:00'
},
{
  user_id: 3,
  username: 'carol@gym.com',
  password: 'password',
  role: 'member',
  created_at: '2024-03-01T11:00:00'
},
{
  user_id: 4,
  username: 'mike@gym.com',
  password: 'password',
  role: 'trainer',
  created_at: '2023-12-01T09:00:00'
},
{
  user_id: 5,
  username: 'sarah@gym.com',
  password: 'password',
  role: 'trainer',
  created_at: '2023-12-01T09:00:00'
},
{
  user_id: 6,
  username: 'admin@fitclub.com',
  password: 'password',
  role: 'admin',
  created_at: '2023-11-01T09:00:00'
}];


export const INITIAL_MEMBERS: Member[] = [
{
  member_id: 1,
  user_id: 1,
  full_name: 'Alice Johnson',
  email: 'alice@gym.com',
  date_of_birth: '1990-05-15',
  gender: 'female',
  phone: '555-0101',
  registered_at: '2024-01-10T09:00:00'
},
{
  member_id: 2,
  user_id: 2,
  full_name: 'Bob Smith',
  email: 'bob@gym.com',
  date_of_birth: '1985-08-22',
  gender: 'male',
  phone: '555-0102',
  registered_at: '2024-02-14T10:30:00'
},
{
  member_id: 3,
  user_id: 3,
  full_name: 'Carol Davis',
  email: 'carol@gym.com',
  date_of_birth: '1995-11-30',
  gender: 'female',
  phone: '555-0103',
  registered_at: '2024-03-01T11:00:00'
}];


export const INITIAL_TRAINERS: Trainer[] = [
{
  trainer_id: 1,
  user_id: 4,
  full_name: 'Mike Torres',
  email: 'mike@gym.com',
  specialization: 'Strength & Conditioning',
  phone: '555-0201'
},
{
  trainer_id: 2,
  user_id: 5,
  full_name: 'Sarah Lee',
  email: 'sarah@gym.com',
  specialization: 'Yoga & Flexibility',
  phone: '555-0202'
}];


export const INITIAL_ROOMS: Room[] = [
{ room_id: 1, room_name: 'Main Gym', capacity: 20, location: 'Ground Floor' },
{
  room_id: 2,
  room_name: 'Yoga Studio',
  capacity: 15,
  location: 'First Floor'
},
{
  room_id: 3,
  room_name: 'Spin Room',
  capacity: 12,
  location: 'Ground Floor'
},
{ room_id: 4, room_name: 'Weight Room', capacity: 10, location: 'Basement' }];


export const INITIAL_FITNESS_GOALS: FitnessGoal[] = [
{
  goal_id: 1,
  member_id: 1,
  goal_type: 'Weight Loss',
  target_value: 65,
  target_unit: 'kg',
  description: 'Lose 10kg by summer',
  is_active: true,
  created_at: '2024-01-15T09:00:00'
},
{
  goal_id: 2,
  member_id: 1,
  goal_type: 'Cardio Fitness',
  target_value: 30,
  target_unit: 'min',
  description: 'Run 30 min without stopping',
  is_active: true,
  created_at: '2024-02-01T09:00:00'
},
{
  goal_id: 3,
  member_id: 2,
  goal_type: 'Muscle Gain',
  target_value: 80,
  target_unit: 'kg',
  description: 'Reach 80kg body weight',
  is_active: true,
  created_at: '2024-02-20T09:00:00'
}];


export const INITIAL_HEALTH_METRICS: HealthMetric[] = [
{
  metric_id: 1,
  member_id: 1,
  metric_type: 'Weight',
  value: 75,
  unit: 'kg',
  recorded_at: '2024-01-10T08:00:00'
},
{
  metric_id: 2,
  member_id: 1,
  metric_type: 'Weight',
  value: 73.5,
  unit: 'kg',
  recorded_at: '2024-02-10T08:00:00'
},
{
  metric_id: 3,
  member_id: 1,
  metric_type: 'Weight',
  value: 72,
  unit: 'kg',
  recorded_at: '2024-03-10T08:00:00'
},
{
  metric_id: 4,
  member_id: 1,
  metric_type: 'Heart Rate',
  value: 78,
  unit: 'bpm',
  recorded_at: '2024-01-10T08:05:00'
},
{
  metric_id: 5,
  member_id: 1,
  metric_type: 'Heart Rate',
  value: 72,
  unit: 'bpm',
  recorded_at: '2024-03-10T08:05:00'
},
{
  metric_id: 6,
  member_id: 2,
  metric_type: 'Weight',
  value: 78,
  unit: 'kg',
  recorded_at: '2024-02-14T09:00:00'
}];


export const INITIAL_TRAINER_AVAILABILITY: TrainerAvailability[] = [
{
  availability_id: 1,
  trainer_id: 1,
  available_date: '2026-03-03',
  start_time: '09:00',
  end_time: '12:00'
},
{
  availability_id: 2,
  trainer_id: 1,
  available_date: '2026-03-04',
  start_time: '14:00',
  end_time: '17:00'
},
{
  availability_id: 3,
  trainer_id: 2,
  available_date: '2026-03-03',
  start_time: '10:00',
  end_time: '13:00'
},
{
  availability_id: 4,
  trainer_id: 2,
  available_date: '2026-03-05',
  start_time: '09:00',
  end_time: '11:00'
}];


export const INITIAL_GROUP_CLASSES: GroupClass[] = [
{
  class_id: 1,
  class_name: 'Morning Yoga',
  trainer_id: 2,
  room_id: 2,
  class_date: '2026-03-03',
  start_time: '10:00',
  end_time: '11:00',
  max_capacity: 15,
  current_enrollment: 2,
  status: 'scheduled'
},
{
  class_id: 2,
  class_name: 'HIIT Blast',
  trainer_id: 1,
  room_id: 1,
  class_date: '2026-03-04',
  start_time: '09:00',
  end_time: '10:00',
  max_capacity: 20,
  current_enrollment: 1,
  status: 'scheduled'
},
{
  class_id: 3,
  class_name: 'Spin Class',
  trainer_id: 1,
  room_id: 3,
  class_date: '2026-03-05',
  start_time: '07:00',
  end_time: '08:00',
  max_capacity: 12,
  current_enrollment: 12,
  status: 'full'
}];


export const INITIAL_CLASS_REGISTRATIONS: ClassRegistration[] = [
{
  registration_id: 1,
  member_id: 1,
  class_id: 1,
  registered_at: '2024-02-20T10:00:00',
  attended: true
},
{
  registration_id: 2,
  member_id: 2,
  class_id: 1,
  registered_at: '2024-02-21T10:00:00',
  attended: true
},
{
  registration_id: 3,
  member_id: 1,
  class_id: 2,
  registered_at: '2024-02-22T10:00:00',
  attended: false
}];


export const INITIAL_PERSONAL_SESSIONS: PersonalSession[] = [
{
  session_id: 1,
  member_id: 1,
  trainer_id: 1,
  room_id: 4,
  session_date: '2026-03-06',
  start_time: '10:00',
  end_time: '11:00',
  status: 'scheduled',
  notes: 'Focus on upper body',
  created_at: '2024-02-25T09:00:00'
},
{
  session_id: 2,
  member_id: 2,
  trainer_id: 1,
  room_id: 4,
  session_date: '2026-03-07',
  start_time: '14:00',
  end_time: '15:00',
  status: 'scheduled',
  notes: 'Leg day',
  created_at: '2024-02-26T09:00:00'
},
{
  session_id: 3,
  member_id: 3,
  trainer_id: 2,
  room_id: 2,
  session_date: '2026-03-08',
  start_time: '11:00',
  end_time: '12:00',
  status: 'scheduled',
  notes: 'Flexibility training',
  created_at: '2024-02-27T09:00:00'
}];


export const INITIAL_EQUIPMENT: Equipment[] = [
{
  equipment_id: 1,
  equipment_name: 'Treadmill #1',
  room_id: 1,
  status: 'operational',
  last_maintained: '2024-01-15',
  notes: ''
},
{
  equipment_id: 2,
  equipment_name: 'Treadmill #2',
  room_id: 1,
  status: 'under repair',
  last_maintained: '2024-02-01',
  notes: 'Belt needs replacement'
},
{
  equipment_id: 3,
  equipment_name: 'Yoga Mats (set)',
  room_id: 2,
  status: 'operational',
  last_maintained: '2024-03-01',
  notes: ''
},
{
  equipment_id: 4,
  equipment_name: 'Spin Bikes',
  room_id: 3,
  status: 'under repair',
  last_maintained: '2024-01-20',
  notes: '3 bikes need pedal repair'
},
{
  equipment_id: 5,
  equipment_name: 'Dumbbells Set',
  room_id: 4,
  status: 'operational',
  last_maintained: '2024-02-15',
  notes: ''
},
{
  equipment_id: 6,
  equipment_name: 'Bench Press',
  room_id: 4,
  status: 'out of service',
  last_maintained: '2023-12-01',
  notes: 'Frame cracked, awaiting replacement'
}];