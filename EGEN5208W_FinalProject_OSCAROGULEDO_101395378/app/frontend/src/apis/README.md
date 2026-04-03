# API Functions Organization

This directory contains all API functions organized by backend routes.

## Structure

- **`index.ts`** - Main API configuration, axios setup, and re-exports
- **`admin.ts`** - Admin-only endpoints (equipment, classes, sessions, payments)
- **`auth.ts`** - Authentication endpoints (login, logout, refresh, verify)
- **`health.ts`** - Health check endpoint
- **`members.ts`** - Member endpoints (profile, goals, classes, bookings, health metrics)
- **`trainers.ts`** - Trainer endpoints (availability, schedule, trainer list)

## Usage

```typescript
// Import specific functions
import { login, logout } from '@/apis/auth';
import { listEquipment, createEquipment } from '@/apis/admin';
import { bookSession, cancelSession } from '@/apis/members';

// Or import everything from apis
import * as apis from '@/apis';
```

## API Coverage

### Admin Endpoints ✅
- `/admin/equipment` - List equipment
- `/admin/equipment-optimized` - Optimized equipment list
- `/admin/equipment/list` - Paginated equipment list
- `/admin/equipment/{id}/status` - Update equipment status
- `/admin/equipment/status-options` - Get status options
- `/admin/equipment` - Create equipment
- `/admin/equipment/{id}` - Update equipment
- `/admin/equipment/{id}` - Delete equipment
- `/admin/classes` - Create class
- `/admin/sessions/{id}/room` - Assign room to session
- `/admin/sessions/list` - List sessions
- `/admin/payments/list` - List payments

### Auth Endpoints ✅
- `/auth/login` - Login
- `/auth/logout` - Logout
- `/auth/refresh` - Refresh token
- `/auth/me` - Get current user info
- `/auth/verify` - Verify token

### Health Endpoints ✅
- `/health/` - Health check

### Members Endpoints ✅
- `/members/me` - Get current member
- `/members/me` - Update current member
- `/members/register` - Register member
- `/members/goals/list` - List goals
- `/members/goals` - Update goals
- `/members/dashboard` - Get dashboard
- `/members/list` - List members
- `/members/book-session` - Book session
- `/members/book-session/{id}` - Cancel session
- `/members/classes/available` - List available classes
- `/members/enroll-class/{id}` - Enroll in class
- `/members/enroll-class/{id}` - Cancel enrollment
- `/members/health-metrics` - Add health metric
- `/members/health-history` - Get health history

### Trainers Endpoints ✅
- `/trainers/availability` - Set availability
- `/trainers/schedule` - Get schedule
- `/trainers/schedule-optimized` - Get optimized schedule
- `/trainers/list` - List trainers

## Notes

- All API functions use the centralized axios instance from `index.ts`
- Error handling is standardized via `handleAxiosResponse`
- All functions return promises that resolve to the API response data
- Parameters match the backend endpoint requirements exactly
