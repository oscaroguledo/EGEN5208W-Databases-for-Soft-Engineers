import api, { handleAxiosResponse } from './index';

export async function listEquipment(skip = 0, limit = 20, status?: string) {
  const params: any = { skip, limit };
  if (status) params.status_filter = status;
  const res = await api.get('/admin/equipment', { params });
  return handleAxiosResponse(res);
}

export async function updateEquipmentStatus(equipment_id: string, status: string, notes?: string) {
  const res = await api.put(`/admin/equipment/${equipment_id}/status`, { status, notes });
  return handleAxiosResponse(res);
}

export async function createClass(payload: any) {
  const res = await api.post('/admin/classes', payload);
  return handleAxiosResponse(res);
}

export async function assignRoomToSession(session_id: string, room_id: string) {
  const res = await api.put(`/admin/sessions/${session_id}/room`, { room_id });
  return handleAxiosResponse(res);
}

export async function getAllEquipmentOptimized(status_filter?: string) {
  const params: any = {};
  if (status_filter) params.status_filter = status_filter;
  const res = await api.get('/admin/equipment-optimized', { params });
  return handleAxiosResponse(res);
}

export async function listEquipmentPaginated(skip = 0, limit = 20, status?: string) {
  const params: any = { skip, limit };
  if (status) params.status_filter = status;
  const res = await api.get('/admin/equipment/list', { params });
  return handleAxiosResponse(res);
}

export async function listSessions(skip = 0, limit = 20, member_id?: string, trainer_id?: string, status_filter?: string) {
  const params: any = { skip, limit };
  if (member_id) params.member_id = member_id;
  if (trainer_id) params.trainer_id = trainer_id;
  if (status_filter) params.status_filter = status_filter;
  const res = await api.get('/admin/sessions/list', { params });
  return handleAxiosResponse(res);
}

export async function listPayments(skip = 0, limit = 20, member_id?: string, subscription_id?: string, status_filter?: string) {
  const params: any = { skip, limit };
  if (member_id) params.member_id = member_id;
  if (subscription_id) params.subscription_id = subscription_id;
  if (status_filter) params.status_filter = status_filter;
  const res = await api.get('/admin/payments/list', { params });
  return handleAxiosResponse(res);
}
