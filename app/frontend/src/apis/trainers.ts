import api, { handleAxiosResponse } from './index';

export async function getTrainerMe() {
  const res = await api.get('/trainers/me');
  return handleAxiosResponse(res);
}

export async function getAvailability() {
  const res = await api.get('/trainers/availability');
  return handleAxiosResponse(res);
}

export async function listTrainersPublic(skip = 0, limit = 100) {
  const res = await api.get('/trainers/public', { params: { skip, limit } });
  return handleAxiosResponse(res);
}

export async function setAvailability(available_date: string, start_at: string, end_at: string) {
  const res = await api.post('/trainers/availability', { available_date, start_at, end_at });
  return handleAxiosResponse(res);
}

export async function getSchedule(days_ahead = 7) {
  const res = await api.get('/trainers/schedule', { params: { days_ahead } });
  return handleAxiosResponse(res);
}

export async function listTrainers(skip = 0, limit = 20) {
  const res = await api.get('/trainers/list', { params: { skip, limit } });
  return handleAxiosResponse(res);
}
