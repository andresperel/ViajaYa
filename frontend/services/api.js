export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.144.1.46:3000';

let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.detalle || data?.mensaje || 'Error de servidor');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function getMyTrips() {
  return apiFetch('/mis-viajes');
}

export async function getMyTripStats() {
  return apiFetch('/mis-viajes/stats');
}

export default API_URL;
