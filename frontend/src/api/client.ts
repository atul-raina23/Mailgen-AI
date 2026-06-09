import { API_URL } from './config';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  bodyData?: any;
}

/**
 * A centralized fetch wrapper that automatically:
 * 1. Prefixes URLs with VITE_API_URL
 * 2. Attaches the JWT authorization token if present
 * 3. Sets Content-Type: application/json for request bodies
 * 4. Standardizes response parsing & error handling
 */
export async function apiFetch<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  // Auto-attach JWT Authorization token
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Auto-set Content-Type and stringify JSON body if bodyData is supplied
  let body: BodyInit | null = null;
  if (options.bodyData) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    body = JSON.stringify(options.bodyData);
  }

  // Normalize endpoint path (supports both absolute and relative paths)
  const isAbsoluteUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://');
  const cleanEndpoint = isAbsoluteUrl
    ? endpoint
    : `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(cleanEndpoint, {
    ...options,
    headers,
    body,
  });

  // Automatically throw error on non-ok statuses
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.message || `API request failed with status: ${response.status}`);
  }

  // Return parsed JSON
  return response.json();
}
