import api, { handleAxiosResponse } from './index';

export async function healthCheck() {
  const res = await api.get('/health/');
  return handleAxiosResponse(res);
}
