import api, { handleAxiosResponse } from './index';

// ── Equipment — paginated (returns full envelope for usePagination) ────────

export async function listEquipment(skip = 0, limit = 20, status?: string) {
  const params: any = { skip, limit };
  if (status) params.status_filter = status;
  const res = await api.get('/admin/equipment', { params });
  const envelope = res?.data;
  return {
    status: envelope?.status ?? 'success',
    message: envelope?.message ?? '',
    data: envelope?.data ?? [],
    pagination: envelope?.pagination ?? { total: 0, page: 1, size: limit, total_pages: 1 },
    status_code: envelope?.status_code ?? 200,
  };
}

export async function createEquipment(payload: {
  equipment_name: string; room_id: string; status?: string; notes?: string;
}) {
  const res = await api.post('/admin/equipment', payload);
  return handleAxiosResponse(res);
}

export async function updateEquipment(equipment_id: string, payload: {
  equipment_name?: string; room_id?: string; status?: string; notes?: string;
}) {
  const res = await api.put(`/admin/equipment/${equipment_id}`, payload);
  return handleAxiosResponse(res);
}

export async function updateEquipmentStatus(equipment_id: string, status: string, notes?: string) {
  const res = await api.put(`/admin/equipment/${equipment_id}/status`, { status, notes });
  return handleAxiosResponse(res);
}

export async function deleteEquipment(equipment_id: string) {
  const res = await api.delete(`/admin/equipment/${equipment_id}`);
  return handleAxiosResponse(res);
}

export async function getEquipmentStatusOptions() {
  const res = await api.get('/admin/equipment/status-options');
  return handleAxiosResponse(res);
}

// ── Classes ────────────────────────────────────────────────────────────────

export async function createClass(payload: {
  name: string; trainer_id: string; room_id: string;
  class_date: string; start_time: string; end_time: string; max_capacity?: number;
}) {
  const res = await api.post('/admin/classes', payload);
  return handleAxiosResponse(res);
}

// ── Sessions ───────────────────────────────────────────────────────────────

export async function assignRoomToSession(session_id: string, room_id: string) {
  const res = await api.put(`/admin/sessions/${session_id}/room`, { room_id });
  return handleAxiosResponse(res);
}

export async function assignRoomToClass(class_id: string, room_id: string) {
  const res = await api.put(`/admin/classes/${class_id}/room`, { room_id });
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

// ── Rooms ────────────────────────────────────────────────────────────────

export async function listRooms(skip = 0, limit = 100) {
  const params: any = { skip, limit };
  const res = await api.get('/admin/rooms', { params });
  return handleAxiosResponse(res);
}

// ── Payments ───────────────────────────────────────────────────────────────

export async function listPayments(skip = 0, limit = 20, member_id?: string, subscription_id?: string, status_filter?: string) {
  const params: any = { skip, limit };
  if (member_id) params.member_id = member_id;
  if (subscription_id) params.subscription_id = subscription_id;
  if (status_filter) params.status_filter = status_filter;
  const res = await api.get('/admin/payments/list', { params });
  return handleAxiosResponse(res);
}
