import api, { handleAxiosResponse } from './index';

// ── Registration ───────────────────────────────────────────────────────────

export async function registerMember(payload: {
  email: string; password: string; full_name: string;
  date_of_birth: string; gender: string; phone: string;
}) {
  const res = await api.post('/members/register', payload);
  return handleAxiosResponse(res);
}

// ── Profile ────────────────────────────────────────────────────────────────

export async function getMemberMe() {
  const res = await api.get('/members/me');
  return handleAxiosResponse(res);
}

export async function updateMemberMe(data: { full_name?: string; phone?: string }) {
  const res = await api.put('/members/me', data);
  return handleAxiosResponse(res);
}

// ── Goals — returns full paginated envelope for usePagination ──────────────

export async function listGoals(member_id?: string, skip = 0, limit = 20) {
  const params: any = { skip, limit };
  if (member_id) params.member_id = member_id;
  const res = await api.get('/members/goals/list', { params });
  // Return the full envelope so usePagination can read pagination metadata
  const envelope = res?.data;
  return {
    status: envelope?.status ?? 'success',
    message: envelope?.message ?? '',
    data: envelope?.data ?? [],
    pagination: envelope?.pagination ?? { total: 0, page: 1, size: limit, total_pages: 1 },
    status_code: envelope?.status_code ?? 200,
  };
}

export async function updateGoals(goalsData: any[]) {
  const res = await api.post('/members/goals', goalsData);
  return handleAxiosResponse(res);
}

// ── Health metrics — returns full paginated envelope ──────────────────────

export async function listHealthHistory(skip = 0, limit = 100, metric_type?: string) {
  const params: any = { skip, limit };
  if (metric_type) params.metric_type = metric_type;
  const res = await api.get('/members/health-history', { params });
  const envelope = res?.data;
  return {
    status: envelope?.status ?? 'success',
    message: envelope?.message ?? '',
    data: envelope?.data ?? [],
    pagination: envelope?.pagination ?? { total: 0, page: 1, size: limit, total_pages: 1 },
    status_code: envelope?.status_code ?? 200,
  };
}

export async function addHealthMetric(metric_type: string, metric_value: number) {
  const res = await api.post('/members/health-metrics', null, { params: { metric_type, metric_value } });
  return handleAxiosResponse(res);
}

// ── Classes — returns full paginated envelope ─────────────────────────────

export async function listAvailableClasses(skip = 0, limit = 100, class_date?: string) {
  const params: any = { skip, limit };
  if (class_date) params.class_date = class_date;
  const res = await api.get('/members/classes/available', { params });
  const envelope = res?.data;
  return {
    status: envelope?.status ?? 'success',
    message: envelope?.message ?? '',
    data: envelope?.data ?? [],
    pagination: envelope?.pagination ?? { total: 0, page: 1, size: limit, total_pages: 1 },
    status_code: envelope?.status_code ?? 200,
  };
}

export async function enrollInClass(class_id: string) {
  const res = await api.post(`/members/enroll-class/${class_id}`);
  return handleAxiosResponse(res);
}

export async function cancelClassEnrollment(class_id: string) {
  const res = await api.delete(`/members/enroll-class/${class_id}`);
  return handleAxiosResponse(res);
}

// ── Sessions ───────────────────────────────────────────────────────────────

export async function bookSession(payload: {
  trainer_id: string; room_id: string;
  session_date: string; start_time: string; end_time: string;
}) {
  // Backend expects query params for this endpoint
  const res = await api.post('/members/book-session', null, { params: payload });
  return handleAxiosResponse(res);
}

export async function cancelSession(session_id: string) {
  const res = await api.delete(`/members/book-session/${session_id}`);
  return handleAxiosResponse(res);
}

// ── Members list (admin) ───────────────────────────────────────────────────

export async function listMembers(skip = 0, limit = 20, gender?: string) {
  const params: any = { skip, limit };
  if (gender) params.gender = gender;
  const res = await api.get('/members/list', { params });
  return handleAxiosResponse(res);
}

export async function getDashboard(days_ahead = 30) {
  const res = await api.get('/members/dashboard', { params: { days_ahead } });
  return handleAxiosResponse(res);
}
