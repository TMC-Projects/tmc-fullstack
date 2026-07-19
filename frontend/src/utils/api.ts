/**
 * Authenticated fetch utility with automatic token refresh.
 *
 * When a request returns 401 with an expired/invalid token, this utility:
 * 1. Calls useAuthStore.refreshAccessToken() to obtain a new access token.
 * 2. Retries the original request once with the new token.
 * 3. If refresh fails, clearAuth() has already been called by the store,
 *    and the user is redirected to the correct login page.
 */

import { useAuthStore } from '@/store/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/** Detect which portal we are in and return its login path. */
function getLoginPath(): string {
  if (typeof window === 'undefined') return '/app/login';
  const { pathname } = window.location;
  if (pathname.startsWith('/portal')) return '/portal/login';
  if (pathname.startsWith('/team-portal')) return '/team-portal/login';
  return '/app/login';
}

/** Returns true when a 401 response indicates the token is expired/invalid (not just missing). */
function isExpiredTokenError(res: Response, body: { message?: string }): boolean {
  if (res.status !== 401) return false;
  const msg = (body?.message || '').toLowerCase();
  return msg.includes('expired') || msg.includes('invalid') || msg.includes('token');
}

export type ApiFetchOptions = RequestInit & {
  /** Override the Authorization token (defaults to token from auth store). */
  token?: string;
  /** Set true to skip automatic token refresh (e.g., login/register calls). */
  skipRefresh?: boolean;
};

/**
 * Drop-in replacement for `fetch` that automatically:
 * - Injects the Bearer token from the auth store.
 * - On 401, attempts a token refresh and retries once.
 * - On refresh failure, redirects to the login page.
 *
 * Usage: replace `fetch(url, { headers: { Authorization: ... } })` with `apiFetch('/api/...')`
 */
export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const { token: overrideToken, skipRefresh = false, ...fetchOptions } = options;

  const buildHeaders = (accessToken: string | null): Headers => {
    const headers = new Headers(fetchOptions.headers);
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    // Don't set Content-Type for FormData — browser sets it with boundary
    if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  };

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const initialToken = overrideToken ?? useAuthStore.getState().token;

  let res = await fetch(url, { ...fetchOptions, headers: buildHeaders(initialToken) });

  if (res.status === 401 && !skipRefresh) {
    let body: { message?: string } = {};
    try { body = await res.clone().json(); } catch { /* ignore */ }

    if (isExpiredTokenError(res, body)) {
      const newToken = await useAuthStore.getState().refreshAccessToken();

      if (newToken) {
        // Retry with fresh token
        res = await fetch(url, { ...fetchOptions, headers: buildHeaders(newToken) });
      } else {
        // Refresh failed — store already called clearAuth, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = getLoginPath();
        }
      }
    }
  }

  return res;
}
