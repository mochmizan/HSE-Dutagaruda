import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { liveGet, livePost } from '@/services/api/liveClient';
import { ApiError } from '@/services/api/client';

export interface SesiPengguna {
  id: string;
  email: string;
  nama: string;
  perusahaanId: string | null;
  peran: string | null;
}

interface SesiMentah {
  user?: { id?: string; email?: string; name?: string } | null;
  session?: { activeOrganizationId?: string | null } | null;
}

function petakanSesi(masuk: SesiMentah | null): SesiPengguna | null {
  if (!masuk?.user?.id) return null;
  return {
    id: String(masuk.user.id),
    email: String(masuk.user.email ?? ''),
    nama: String(masuk.user.name ?? masuk.user.email ?? 'Pengawas'),
    perusahaanId: masuk.session?.activeOrganizationId ?? null,
    peran: null,
  };
}

async function ambilSesi(): Promise<SesiPengguna | null> {
  try {
    const mentah = await liveGet<SesiMentah | null>('/auth/get-session');
    if (!mentah || !mentah.user) return null;
    return petakanSesi(mentah);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export function useSesi() {
  return useQuery({
    queryKey: ['sesi'],
    queryFn: ambilSesi,
    retry: false,
    staleTime: 60_000,
  });
}

function ambilDaftarOrganisasi(mentah: unknown): Array<{ id: string }> {
  if (Array.isArray(mentah)) return mentah as Array<{ id: string }>;
  if (mentah && typeof mentah === 'object') {
    const rek = mentah as Record<string, unknown>;
    if (Array.isArray(rek.data)) return rek.data as Array<{ id: string }>;
    if (Array.isArray(rek.organizations)) return rek.organizations as Array<{ id: string }>;
    if (Array.isArray(rek.items)) return rek.items as Array<{ id: string }>;
  }
  return [];
}

export interface Proyek {
  id: string;
  nama: string;
}

function petakanProyek(mentah: unknown): Proyek[] {
  const daftar = ambilDaftarOrganisasi(mentah) as Array<{ id?: unknown; name?: unknown }>;
  return daftar
    .filter((o) => typeof o.id === 'string')
    .map((o) => ({ id: String(o.id), nama: typeof o.name === 'string' && o.name ? o.name : String(o.id) }));
}

/** Daftar proyek (organisasi) milik pengguna — tiap proyek punya lokasi sendiri. */
export function useDaftarProyek() {
  return useQuery({
    queryKey: ['proyek'],
    queryFn: async () => petakanProyek(await liveGet<unknown>('/auth/organization/list')),
    staleTime: 60_000,
  });
}

/** Pindah proyek aktif: set organisasi aktif lalu muat ulang seluruh data. */
export function usePindahProyek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (organizationId: string) => {
      await livePost('/auth/organization/set-active', { organizationId });
      return ambilSesi();
    },
    onSuccess: (sesi) => {
      qc.setQueryData(['sesi'], sesi);
      void qc.invalidateQueries();
    },
    onError: (err) => window.alert(err instanceof ApiError ? err.message : 'Gagal pindah proyek.'),
  });
}

export function useMasuk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (masukan: { email: string; sandi: string }) => {
      await livePost('/auth/sign-in/email', {
        email: masukan.email.trim(),
        password: masukan.sandi,
      });
      let organisasiId = 'seed-perusahaan-1';
      try {
        const daftar = await liveGet<unknown>('/auth/organization/list');
        const orgs = ambilDaftarOrganisasi(daftar);
        if (orgs.length > 0 && orgs[0]?.id) organisasiId = String(orgs[0].id);
      } catch {
        // Tetap coba bawaan benih bila daftar gagal dibaca.
      }
      await livePost('/auth/organization/set-active', { organizationId: organisasiId });
      const sesi = await ambilSesi();
      return sesi;
    },
    onSuccess: (sesi) => {
      qc.setQueryData(['sesi'], sesi);
      void qc.invalidateQueries();
    },
  });
}

export function useKeluar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await livePost('/auth/sign-out', {});
      } catch (err) {
        if (!(err instanceof ApiError && (err.status === 401 || err.status === 400))) throw err;
      }
    },
    onSuccess: () => {
      qc.setQueryData(['sesi'], null);
      qc.clear();
    },
  });
}
