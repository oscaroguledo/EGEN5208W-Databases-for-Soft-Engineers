// Shared types for the FitClub app — aligned with backend API responses

export type UserRole = 'member' | 'trainer' | 'admin';
export type Gender = 'male' | 'female' | 'other';
export type ClassStatus = 'scheduled' | 'full' | 'cancelled' | 'completed';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type EquipmentStatus = 'operational' | 'under_repair' | 'out_of_service';

// ── Auth / User ────────────────────────────────────────────────────────────
// Returned by /auth/login (data.user) and /auth/me (data)
export interface User {
  id: string;          // UUID
  email: string;
  role: UserRole;
  full_name: string;
}

// ── Member ─────────────────────────────────────────────────────────────────
// Returned by /members/me, /members/register, /members/list
export interface Member {
  id: string;          // UUID — same as the linked user id
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  phone: string;
  created_at: string;
  updated_at: string;
}

// ── Trainer ────────────────────────────────────────────────────────────────
// Returned by /trainers/list
export interface Trainer {
  id: string;          // UUID
  full_name: string;
  created_at: string;
  updated_at: string;
}

// ── Room ───────────────────────────────────────────────────────────────────
// Not yet returned by the API — kept for local use / future endpoint
export interface Room {
  id: string;
  name: string;
  capacity: number;
}

// ── Fitness Goal ───────────────────────────────────────────────────────────
// Returned by /members/goals/list, /members/goals (POST)
export interface FitnessGoal {
  id: string;          // UUID
  member_id: string;
  description: string;
  target_value: string | null;   // stored as string in DB
  created_at: string;
}

// ── Health Metric ──────────────────────────────────────────────────────────
// Returned by /members/health-history
export interface HealthMetric {
  id: string;          // UUID
  member_id: string;
  metric_type: string;
  metric_value: number;
  recorded_at: string;
}

// ── Trainer Availability ───────────────────────────────────────────────────
// Returned by /trainers/schedule (data.availability[])
export interface TrainerAvailability {
  id: string;          // UUID
  trainer_id: string;
  available_date: string;
  start_at: string;
  end_at: string;
}

// ── Group Class ────────────────────────────────────────────────────────────
// Returned by /members/classes/available, /admin/classes (POST)
export interface GroupClass {
  id: string;          // UUID
  name: string;
  trainer_id: string;
  room_id: string;
  class_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  created_at: string;
}

// ── Class Enrollment ───────────────────────────────────────────────────────
// Returned by /members/enroll-class/{id} (POST)
export interface ClassEnrollment {
  enrollment_id: string;
  member_id: string;
  class_id: string;
  registered_at: string;
}

// ── Training Session ───────────────────────────────────────────────────────
// Returned by /members/book-session, /admin/sessions/list
export interface TrainingSession {
  id: string;          // UUID
  trainer_id: string;
  member_id: string;
  room_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: SessionStatus;
  created_at: string;
}

// ── Equipment ──────────────────────────────────────────────────────────────
// Returned by /admin/equipment, /admin/equipment/list
export interface Equipment {
  id: string;          // UUID
  room_id: string;
  equipment_name: string;
  status: EquipmentStatus;
  maintenance_notes?: string;
  created_at: string;
  updated_at: string;
}

// ── Pagination ─────────────────────────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
export function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 < e2 && s2 < e1;
}
