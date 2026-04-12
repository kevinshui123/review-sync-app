// Centralized API fetch utility that automatically adds Authorization header

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiFetch(
  url: string,
  options: ApiOptions = {}
): Promise<Response> {
  const { requireAuth = true, ...fetchOptions } = options;
  
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  // Add Authorization header if requireAuth is true (default) and token exists
  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return fetch(url, {
    ...fetchOptions,
    headers,
  });
}

// Shorthand for authenticated GET requests
export async function apiGet(url: string, options?: ApiOptions): Promise<Response> {
  return apiFetch(url, { ...options, method: 'GET' });
}

// Shorthand for authenticated POST requests
export async function apiPost(
  url: string,
  body?: unknown,
  options?: ApiOptions
): Promise<Response> {
  return apiFetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Shorthand for authenticated PUT requests
export async function apiPut(
  url: string,
  body?: unknown,
  options?: ApiOptions
): Promise<Response> {
  return apiFetch(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Shorthand for authenticated DELETE requests
export async function apiDelete(url: string, options?: ApiOptions): Promise<Response> {
  return apiFetch(url, { ...options, method: 'DELETE' });
}
