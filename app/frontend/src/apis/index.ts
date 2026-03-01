import axios from 'axios';

export const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

export function handleAxiosResponse(res: any) {
  const data = res?.data;
  if (!res || res.status >= 400) {
    throw new Error((data && (data.detail || data.message)) || res.statusText || 'API error');
  }
  return data && data.data !== undefined ? data.data : data;
}

export default api;
