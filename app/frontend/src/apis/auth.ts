import api, { handleAxiosResponse, TokenStore } from './index';

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  const data = handleAxiosResponse(res);
  // Persist both tokens so the interceptor can auto-refresh
  if (data?.access_token && data?.refresh_token) {
    TokenStore.setTokens(data.access_token, data.refresh_token);
  }
  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    // Always clear locally, even if the server call fails
    TokenStore.clear();
  }
}

export async function me() {
  const res = await api.get('/auth/me');
  return handleAxiosResponse(res);
}

export async function refresh(refreshToken: string) {
  const res = await api.post('/auth/refresh', { refresh_token: refreshToken });
  const data = handleAxiosResponse(res);
  if (data?.access_token) {
    TokenStore.setAccess(data.access_token);
  }
  return data;
}

export async function verify() {
  const res = await api.get('/auth/verify');
  return handleAxiosResponse(res);
}
