import api, { handleAxiosResponse } from './index';

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  return handleAxiosResponse(res);
}

export async function logout() {
  const res = await api.post('/auth/logout');
  return handleAxiosResponse(res);
}

export async function me() {
  const res = await api.get('/auth/me');
  return handleAxiosResponse(res);
}
