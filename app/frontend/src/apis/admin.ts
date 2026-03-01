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
