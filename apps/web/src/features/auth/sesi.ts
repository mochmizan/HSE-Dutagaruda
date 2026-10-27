import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { liveGet, livePost } from '@/services/api/liveClient';
import {
  ambilProyekAktif,
  buatProyek,
  hapusProyek,
  rekamProyekAktif,
  ubahProyek,
} from '@/services/api/klien';
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

/**
 * Pasang proyek aktif: set organisasi aktif di sesi, lalu catat pilihannya di
 * server supaya bertahan saat keluar/masuk lagi atau pindah peramban.
 */
async function pasangProyekAktif(organizationId: string): Promise<void> {
  await livePost('/auth/organization/set-active', { organizationId });
  await rekamProyekAktif(organizationId).catch(() => {
    // Pencatatan preferensi tidak boleh menggagalkan perpindahan proyek.
  });
}

/**
 * Tentukan proyek aktif setelah masuk: pakai catatan server (pilihan terakhir
 * pengguna), lalu organisasi pertama, lalu benih. Tanpa ini klien menebak
 * organisasi pertama setiap kali masuk sehingga proyek pilihan pengguna
 * seolah hanya tersimpan di peramban.
 */
async function pulihkanProyek(): Promise<void> {
  let target: string | null = null;
  try {
    target = (await ambilProyekAktif()).organizationId;
  } catch {
    target = null;
  }
  if (!target) {
    try {
      const orgs = ambilDaftarOrganisasi(await liveGet<unknown>('/auth/organization/list'));
      target = orgs[0]?.id ? String(orgs[0].id) : null;
    } catch {
      target = null;
    }
  }
  await pasangProyekAktif(target ?? 'seed-perusahaan-1');
}

/** Proyek baru: buat, jadikan aktif, muat ulang seluruh data. */
export function useBuatProyek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nama: string) => {
      const baris = await buatProyek(nama.trim());
      await pasangProyekAktif(baris.id);
      return baris;
    },
    onSuccess: async () => {
      qc.setQueryData(['sesi'], await ambilSesi());
      await qc.invalidateQueries();
    },
    onError: (err) => window.alert(err instanceof ApiError ? err.message : 'Gagal menambah proyek.'),
  });
}
/** Pindah proyek aktif: set organisasi aktif lalu muat ulang seluruh data. */
export function usePindahProyek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (organizationId: string) => {
      await pasangProyekAktif(organizationId);
      return ambilSesi();
    },
    onSuccess: (sesi) => {
      qc.setQueryData(['sesi'], sesi);
      void qc.invalidateQueries();
    },
    onError: (err) => window.alert(err instanceof ApiError ? err.message : 'Gagal pindah proyek.'),
  });
}

/**
 * Pemulihan proyek aktif saat sesi belum punya organisasi aktif — misalnya
 * sesi dibuat di luar alur masuk UI. Idempoten; aman dipanggil sekali per sesi.
 */
export function usePulihkanProyek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await pulihkanProyek();
      return ambilSesi();
    },
    onSuccess: (sesi) => {
      qc.setQueryData(['sesi'], sesi);
      void qc.invalidateQueries();
    },
    onError: () => {
      // Tidak ada proyek tersimpan dan belum ada organisasi: biarkan layar
      // kosong apa adanya, jangan berkedip pesan galat.
    },
  });
}

/** Ganti nama proyek (organisasi + cermin companies). */
export function useUbahProyek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; nama: string }) => ubahProyek(args.id, args.nama.trim()),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['proyek'] });
    },
    onError: (err) => window.alert(err instanceof ApiError ? err.message : 'Gagal mengganti nama proyek.'),
  });
}

/** Hapus proyek tanpa lokasi. Pengalihan proyek aktif ditangani pemanggil. */
export function useHapusProyek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hapusProyek(id),
    onSuccess: () => {
      void qc.invalidateQueries();
    },
    onError: (err) => window.alert(err instanceof ApiError ? err.message : 'Gagal menghapus proyek.'),
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
      // Sesi baru selalu lahir tanpa organisasi aktif: pasang proyek yang
      // tercatat di server, bukan menebak organisasi pertama.
      await pulihkanProyek();
      return ambilSesi();
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
