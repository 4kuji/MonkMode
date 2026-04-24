/**
 * API Service Layer
 * Centralized API calls with JWT authentication.
 * Uses fetch (no axios dependency needed).
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Token helpers ───────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// ─── Base fetch wrapper ──────────────────────────────────────────

async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  requireAuth = true,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requireAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401 and we have a refresh token, try to refresh
  if (response.status === 401 && requireAuth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry the original request with new token
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      // Refresh failed — clear everything
      clearTokens();
    }
  }

  return response;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.access, data.refresh || refreshToken);
      return true;
    }
  } catch {
    // Refresh failed silently
  }
  return false;
}

// ─── Auth API ────────────────────────────────────────────────────

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface RegisterResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await apiFetch(
    '/token/',
    {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    },
    false, // No auth needed for login
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('E-posta veya şifre hatalı.');
    }
    throw new Error(
      errorData.detail || errorData.error || 'Giriş yapılamadı.',
    );
  }

  const data: LoginResponse = await response.json();

  // Store tokens and user info
  setTokens(data.access, data.refresh);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const response = await apiFetch(
    '/register/',
    {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    },
    false, // No auth needed for registration
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Handle field-level errors from DRF serializer
    const firstError =
      errorData.email?.[0] ||
      errorData.password?.[0] ||
      errorData.name?.[0] ||
      errorData.detail ||
      'Kayıt işlemi başarısız.';
    throw new Error(firstError);
  }

  const data: RegisterResponse = await response.json();

  // Store tokens and user info
  setTokens(data.access, data.refresh);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
}

// ─── AI Chat API ─────────────────────────────────────────────────

interface ChatResponse {
  response: string;
}

export async function sendChatMessage(
  message: string,
): Promise<ChatResponse> {
  const response = await apiFetch('/chat/', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.detail || 'AI yanıtı alınamadı.',
    );
  }

  return response.json();
}

// ─── Logout ──────────────────────────────────────────────────────

export function logoutUser(): void {
  clearTokens();
}
