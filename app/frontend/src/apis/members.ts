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
