import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_STORAGE_KEY = '@viajaya/auth-token';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

type ApiError = { mensaje?: string };

export type ApiUser = {
  idUsuario: number;
  nombre: string;
  email: string;
  telefono?: number | string;
  fechaRegistro?: string;
};

export type AuthResponse = { token: string; usuario: ApiUser };

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as ApiError).mensaje || 'No se pudo completar la solicitud.');
  return data as T;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return parseResponse<T>(await fetch(`${API_URL}${path}`, { ...options, headers }));
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse<AuthResponse>(response);
}

export async function register(input: {
  nombre: string;
  email: string;
  telefono: string;
  password: string;
}): Promise<{ mensaje: string; usuario: ApiUser }> {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseResponse<{ mensaje: string; usuario: ApiUser }>(response);
}

export async function getProfile(): Promise<{ usuario: ApiUser }> {
  return apiFetch('/me');
}

export async function getMyTrips() {
  return apiFetch('/mis-viajes');
}
