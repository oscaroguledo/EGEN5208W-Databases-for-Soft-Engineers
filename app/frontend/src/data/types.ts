// Shared types for the FitClub app

export type UserRole = 'member' | 'trainer' | 'admin';
export type Gender = 'male' | 'female' | 'other';
export type ClassStatus = 'scheduled' | 'full' | 'cancelled' | 'completed';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type EquipmentStatus = 'operational' | 'under repair' | 'out of service';

export interface User {
  user_id: number;
  username: string;
  password: string;
  role: UserRole;
  created_at: string;
}

export interface Member {
  member_id: number;
  user_id: number;
  full_name: string;
  email: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  registered_at: string;
}

export interface Trainer {
  trainer_id: number;
  user_id: number;
  full_name: string;
  email: string;
  specialization: string;
  phone: string;
}

export interface Room {
  room_id: number;
  room_name: string;
  capacity: number;
  location: string;
}

export interface FitnessGoal {
  goal_id: number;
  member_id: number;
  goal_type: string;
  target_value: number;
  target_unit: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface HealthMetric {
  metric_id: number;
  member_id: number;
  metric_type: string;
  value: number;
  unit: string;
  recorded_at: string;
}

export interface TrainerAvailability {
  availability_id: number;
  trainer_id: number;
  available_date: string;
  start_time: string;
  end_time: string;
}

export interface GroupClass {
  class_id: number;
  class_name: string;
  trainer_id: number;
  room_id: number;
  class_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  current_enrollment: number;
  status: ClassStatus;
}

export interface ClassRegistration {
  registration_id: number;
  member_id: number;
  class_id: number;
  registered_at: string;
  attended: boolean;
}

export interface PersonalSession {
  session_id: number;
  member_id: number;
  trainer_id: number;
  room_id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  status: SessionStatus;
  notes: string;
  created_at: string;
}

export interface Equipment {
  equipment_id: number;
  equipment_name: string;
  room_id: number;
  status: EquipmentStatus;
  last_maintained: string;
  notes: string;
}

export function timesOverlap(
s1: string,
e1: string,
s2: string,
e2: string)
: boolean {
  return s1 < e2 && s2 < e1;
}