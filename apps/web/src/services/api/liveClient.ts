/**
 * Klien HTTP sesi kuki untuk API HSE.
 * Batas sistem: validasi + kredensial di sini; isi memakai tipe.
 */

import { ApiError } from './client';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  const body = init.body;
  if (body !== undefined && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    let detail: unknown = null;
    try {
      detail = await res.json();
    } catch {
      try {
        detail = await res.text();
      } catch {
        detail = null;
      }
    }
    const pesan =
      typeof detail === 'object' && detail !== null && 'detail' in detail
        ? String((detail as { detail: unknown }).detail)
        : typeof detail === 'object' && detail !== null && 'message' in detail
          ? String((detail as { message: unknown }).message)
          : `Permintaan gagal (${res.status}).`;
    throw new ApiError(res.status, res.statusText, { pesan, detail });
  }
  if (res.status === 204) return {} as T;
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export const liveGet = <T>(path: string) => apiFetch<T>(path, { method: 'GET' });

export const livePost = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

/** POST multipart/form-data (unggahan berkas); Content-Type disetel peramban. */
export const livePostForm = <T>(path: string, form: FormData) =>
  apiFetch<T>(path, { method: 'POST', body: form });

export const livePatch = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

export const livePut = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });

export const liveDelete = <T>(path: string) =>
  apiFetch<T>(path, { method: 'DELETE' });

export function livePhotoUrl(id: string): string {
  return `${API_BASE}/photos/${id}`;
}

/** Berkas peta proyek (denah) via GET /api/project-maps/:id/berkas (302 presigned). */
export function livePetaUrl(id: string): string {
  return `${API_BASE}/project-maps/${encodeURIComponent(id)}/berkas`;
}

export function liveApiBase(): string {
  return API_BASE;
}
