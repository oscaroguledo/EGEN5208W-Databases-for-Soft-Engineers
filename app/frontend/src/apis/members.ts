import api, { handleAxiosResponse } from './index';

export async function getMemberMe() {
  const res = await api.get('/members/me');
  return handleAxiosResponse(res);
}

export async function updateMemberMe(data: { full_name?: string; phone?: string }) {
  const res = await api.put('/members/me', data);
  return handleAxiosResponse(res);
}

export async function listGoals(member_id?: string, skip = 0, limit = 20) {
  const params: any = { skip, limit };
  if (member_id) params.member_id = member_id;
  const res = await api.get('/members/goals/list', { params });
  return handleAxiosResponse(res);
}

export async function updateGoals(goalsData: any[]) {
  const res = await api.post('/members/goals', goalsData);
  return handleAxiosResponse(res);
}

export async function registerMember(payload: { email: string; password: string; full_name: string; date_of_birth: string; gender: string; phone: string }) {
  const res = await api.post('/members/register', payload);
  return handleAxiosResponse(res);
}

export async function getDashboard(days_ahead = 30) {
  const res = await api.get('/members/dashboard', { params: { days_ahead } });
  return handleAxiosResponse(res);
}

export async function listMembers(skip = 0, limit = 20, gender?: string) {
  const params: any = { skip, limit };
  if (gender) params.gender = gender;
  const res = await api.get('/members/list', { params });
  return handleAxiosResponse(res);
}

export async function bookSession(payload: { trainer_id: string; room_id: string; session_date: string; start_time: string; end_time: string }) {
  const res = await api.post('/members/book-session', payload);
  return handleAxiosResponse(res);
}

export async function enrollInClass(class_id: string) {
  const res = await api.post(`/members/enroll-class/${class_id}`);
  return handleAxiosResponse(res);
}

export async function cancelClassEnrollment(class_id: string) {
  const res = await api.delete(`/members/enroll-class/${class_id}`);
  return handleAxiosResponse(res);
}

export async function addHealthMetric(metric_type: string, metric_value: number) {
  const res = await api.post('/members/health-metrics', { metric_type, metric_value });
  return handleAxiosResponse(res);
}

export async function listHealthHistory(skip = 0, limit = 100, metric_type?: string) {
  const params: any = { skip, limit };
  if (metric_type) params.metric_type = metric_type;
  const res = await api.get('/members/health-history', { params });
  return handleAxiosResponse(res);
}
