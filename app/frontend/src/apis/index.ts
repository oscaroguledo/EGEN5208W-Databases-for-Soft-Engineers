const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://localhost:8000';

async function handleResponse(res: Response) {
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    const err = (data && (data.detail || data.message)) || res.statusText || 'API error';
    throw new Error(err);
  }
  // FastAPI responses use { status, message, data }
  return data && data.data !== undefined ? data.data : data;
}

export { API_BASE, handleResponse };
