import api, { handleAxiosResponse } from './index';

export async function setAvailability(available_date: string, start_at: string, end_at: string) {
  const res = await api.post('/trainers/availability', { available_date, start_at, end_at });
  return handleAxiosResponse(res);
}

export async function getSchedule(days_ahead = 7) {
  const res = await api.get('/trainers/schedule', { params: { days_ahead } });
  return handleAxiosResponse(res);
}

export async function getScheduleOptimized(days_ahead = 7) {
  const res = await api.get('/trainers/schedule-optimized', { params: { days_ahead } });
  return handleAxiosResponse(res);
}

export async function listTrainers(skip = 0, limit = 20) {
  const res = await api.get('/trainers/list', { params: { skip, limit } });
  return handleAxiosResponse(res);
}
