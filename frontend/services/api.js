export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');

let authToken = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export async function apiFetch(path, options = {}) {
  if (!API_URL) throw new Error('Falta configurar EXPO_PUBLIC_API_URL y reiniciar Expo.');
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
    ...(options.headers || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers,
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error('La API no responde correctamente. Verifica que el backend y el tunel ngrok esten activos.');
    }

    if (!response.ok) {
      const error = new Error(data?.detalle || data?.mensaje || 'Error de servidor');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('El servidor demoro demasiado. Intenta nuevamente.');
    if (error instanceof TypeError) throw new Error('No pude conectarme con el servidor. Verifica la conexion y el tunel ngrok.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getMyTrips() {
  return apiFetch('/mis-viajes');
}

export async function getMyTripStats() {
  return apiFetch('/mis-viajes/stats');
}

export default API_URL;
