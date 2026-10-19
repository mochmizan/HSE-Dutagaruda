/**
 * Klien endpoint API HSE — bentuk respons dideklarasikan eksplisit di sini
 * (batas sistem), lalu dipercaya di seluruh aplikasi.
 *
 * Catatan: klien RPC `hc<AppType>` dari apps/api belum membawa tipe rute
 * (AppType = BlankSchema karena registrasi rute tidak dirantai), sehingga
 * pemanggilan memakai fetch + deklarasi tipe di berkas ini.
 */

import { liveGet, livePost, livePatch, liveDelete, livePostForm, liveApiBase } from './liveClient';
import { ApiError } from './client';

export interface Halaman<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ApiSite {
  id: string;
  companyId: string;
  name: string;
  address: string | null;
  createdAt: string;
}

export interface ApiZone {
  id: string;
  companyId: string;
  siteId: string;
  name: string;
  createdAt: string;
}

export interface ApiHydrantUnit {
  id: string;
  companyId: string;
  siteId: string;
  zoneId: string;
  kode: string;
  createdAt: string;
}

export type ApiAparJenis = 'POWDER' | 'CO2' | 'FOAM' | 'OTHER';

export interface ApiAparUnit {
  id: string;
  companyId: string;
  siteId: string;
  zoneId: string;
  kode: string;
  tahun: number | null;
  jenis: ApiAparJenis | null;
  ukuran: string | null;
  expiredDate: string;
  createdAt: string;
}

export interface ApiP3kBox {
  id: string;
  companyId: string;
  siteId: string;
  name: string;
  createdAt: string;
}

export type ApiStatusHidran = 'LAYAK' | 'TIDAK_LAYAK' | 'HILANG';
export type ApiStatusApar = 'BAIK' | 'TIDAK_BAIK' | 'NA';
export type ApiStatusP3k = 'STANDAR' | 'DIBAWAH_STANDAR' | 'KADALUARSA';
export type ApiStatusAkhir = 'LAYAK' | 'LAYAK_DENGAN_CATATAN' | 'TIDAK_LAYAK';
export type ApiStatusApproval = 'DRAFT' | 'DIAJUKAN' | 'DIKETAHUI' | 'DISETUJUI';

export interface ApiInspeksiHidran {
  id: string;
  companyId: string;
  unitId: string;
  /** Tanggal pertama bulan periode (YYYY-MM-DD). */
  period: string;
  boxHydrant: ApiStatusHidran;
  fireHose: ApiStatusHidran;
  hoseCoupling: ApiStatusHidran;
  hoseRack: ApiStatusHidran;
  nozzle: ApiStatusHidran;
  valvePillar: ApiStatusHidran;
  overallStatus: ApiStatusAkhir;
  overallOverridden: boolean;
  approvalStatus: ApiStatusApproval;
  notes: string | null;
  createdAt: string;
}

export interface ApiInspeksiApar {
  id: string;
  companyId: string;
  unitId: string;
  period: string;
  safetyPin: ApiStatusApar;
  corong: ApiStatusApar;
  segel: ApiStatusApar;
  tekanan: ApiStatusApar;
  tabung: ApiStatusApar;
  selang: ApiStatusApar;
  katupTuas: ApiStatusApar;
  beratCo2Kg: number | null;
  overallStatus: ApiStatusAkhir;
  overallOverridden: boolean;
  approvalStatus: ApiStatusApproval;
  notes: string | null;
  createdAt: string;
}

export interface ApiInspeksiP3k {
  id: string;
  companyId: string;
  boxId: string;
  period: string;
  notes: string | null;
  inspectionDate: string | null;
  paraf: string | null;
  createdAt: string;
  items?: ApiButirP3k[];
}

export interface ApiButirP3k {
  id: string;
  companyId: string;
  inspectionId: string;
  itemName: string;
  standardQty: number;
  actualQty: number;
  status: ApiStatusP3k;
  createdAt: string;
}

export interface ApiLaporanPatroli {
  id: string;
  companyId: string;
  siteId: string;
  patrolDate: string;
  inspectorUserId: string;
  createdAt: string;
  findings?: ApiTemuanPatroli[];
}

export interface ApiTemuanPatroli {
  id: string;
  companyId: string;
  reportId: string;
  description: string;
  s3Key: string;
  mime: string | null;
  bytes: number | null;
  sha256: string | null;
  locationNote: string | null;
  createdAt: string;
}

export interface ApiUmpan {
  month: string;
  hydrant: Array<ApiInspeksiHidran & { category: 'hydrant' }>;
  apar: Array<ApiInspeksiApar & { category: 'apar' }>;
  p3k: Array<ApiInspeksiP3k & { category: 'p3k' }>;
  patroli: Array<ApiLaporanPatroli & { category: 'patroli' }>;
}

// ── Permintaan ──

/** Cakupan daftar: lokasi aktif dan/atau bulan (`YYYY-MM`). Keduanya opsional
 *  supaya pemanggil lama tetap sah; server menyaring di SQL. */
export interface CakupanDaftar {
  siteId?: string;
  period?: string;
}

/** Satu-satunya tempat menyusun query string daftar. */
export function kueriDaftar(cakupan: CakupanDaftar & { cursor?: string; limit?: number }): string {
  const q = new URLSearchParams();
  if (cakupan.siteId) q.set('siteId', cakupan.siteId);
  if (cakupan.period) q.set('period', cakupan.period);
  if (cakupan.cursor) q.set('cursor', cakupan.cursor);
  if (cakupan.limit !== undefined) q.set('limit', String(cakupan.limit));
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Batas keras pengambilan berantai; mencegah loop tanpa ujung bila server
 *  mengembalikan kursor yang sama terus. */
const BATAS_BARIS = 2000;
const UKURAN_HALAMAN = 100;

/**
 * Ambil SELURUH baris sebuah daftar dengan mengikuti `nextCursor`.
 *
 * Server membatasi satu halaman. Pemanggil tidak boleh menerima himpunan
 * terpotong diam-diam, jadi kursor selalu diikuti di sini: daftar lebih dari
 * satu halaman tetap utuh, dan bila melewati `BATAS_BARIS` permintaan gagal
 * dengan pesan jelas alih-alih memotong data.
 */
async function ambilSemua<T>(path: string, cakupan: CakupanDaftar = {}): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await liveGet<Halaman<T>>(
      `${path}${kueriDaftar({ ...cakupan, limit: UKURAN_HALAMAN, cursor })}`,
    );
    items.push(...page.items);
    if (page.nextCursor === null) return items;
    if (items.length >= BATAS_BARIS) {
      throw new ApiError(0, 'Batas baris', {
        pesan: `Daftar melebihi ${BATAS_BARIS} baris. Persempit cakupan lokasi atau bulan.`,
      });
    }
    cursor = page.nextCursor;
  }
}

export const ambilLokasi = () => ambilSemua<ApiSite>('/sites');

export const buatLokasi = (body: { name: string; address?: string }) =>
  livePost<ApiSite>('/sites', body);

export const ubahLokasi = (id: string, body: { name?: string; address?: string }) =>
  livePatch<ApiSite>(`/sites/${id}`, body);

export const ambilZona = (cakupan: CakupanDaftar = {}) => ambilSemua<ApiZone>('/zones', cakupan);

export const ambilUnitHidran = (cakupan: CakupanDaftar = {}) =>
  ambilSemua<ApiHydrantUnit>('/hydrant-units', cakupan);

export const ambilUnitApar = (cakupan: CakupanDaftar = {}) =>
  ambilSemua<ApiAparUnit>('/apar-units', cakupan);

export const ambilKotakP3k = (cakupan: CakupanDaftar = {}) =>
  ambilSemua<ApiP3kBox>('/p3k-boxes', cakupan);

export const ambilInspeksiHidran = (cakupan: CakupanDaftar = {}) =>
  ambilSemua<ApiInspeksiHidran>('/hydrant-inspections', cakupan);

export const ambilInspeksiApar = (cakupan: CakupanDaftar = {}) =>
  ambilSemua<ApiInspeksiApar>('/apar-inspections', cakupan);

export const ambilInspeksiP3k = (cakupan: CakupanDaftar = {}) =>
  ambilSemua<ApiInspeksiP3k>('/p3k-inspections', cakupan);

export const ambilButirP3k = (inspectionId: string) =>
  liveGet<ApiInspeksiP3k>(`/p3k-inspections/${inspectionId}`);

export const ambilLaporanPatroli = (cakupan: CakupanDaftar = {}) =>
  ambilSemua<ApiLaporanPatroli>('/safety-patrol-reports', cakupan);

export const ambilTemuanPatroli = (reportId: string) =>
  liveGet<{ items: ApiTemuanPatroli[] }>(`/safety-patrol-reports/${reportId}/findings`);

export const ambilUmpan = (month: string) =>
  liveGet<ApiUmpan>(`/inspections?month=${encodeURIComponent(month)}`);

export interface MasukanInspeksiHidran {
  unitId: string;
  month: string;
  boxHydrant: ApiStatusHidran;
  fireHose: ApiStatusHidran;
  hoseCoupling: ApiStatusHidran;
  hoseRack: ApiStatusHidran;
  nozzle: ApiStatusHidran;
  valvePillar: ApiStatusHidran;
  overallStatus?: ApiStatusAkhir;
  overallOverridden?: boolean;
  approvalStatus?: ApiStatusApproval;
  notes?: string;
}

export const buatInspeksiHidran = (body: MasukanInspeksiHidran) =>
  livePost<ApiInspeksiHidran>('/hydrant-inspections', body);

export const ubahInspeksiHidran = (
  id: string,
  body: Partial<Omit<MasukanInspeksiHidran, 'unitId' | 'month'>>,
) => livePatch<ApiInspeksiHidran>(`/hydrant-inspections/${id}`, body);

export const hapusInspeksiHidran = (id: string) => liveDelete(`/hydrant-inspections/${id}`);

export interface MasukanInspeksiApar {
  unitId: string;
  month: string;
  safetyPin: ApiStatusApar;
  corong: ApiStatusApar;
  segel: ApiStatusApar;
  tekanan: ApiStatusApar;
  tabung: ApiStatusApar;
  selang: ApiStatusApar;
  katupTuas: ApiStatusApar;
  overallStatus?: ApiStatusAkhir;
  overallOverridden?: boolean;
  approvalStatus?: ApiStatusApproval;
  notes?: string;
}

export const buatInspeksiApar = (body: MasukanInspeksiApar) =>
  livePost<ApiInspeksiApar>('/apar-inspections', body);

export const ubahInspeksiApar = (
  id: string,
  body: Partial<Omit<MasukanInspeksiApar, 'unitId' | 'month'>>,
) => livePatch<ApiInspeksiApar>(`/apar-inspections/${id}`, body);

export const hapusInspeksiApar = (id: string) => liveDelete(`/apar-inspections/${id}`);

export const buatInspeksiP3k = (body: {
  boxId: string;
  month: string;
  notes?: string;
  inspectionDate?: string;
  paraf?: string;
}) => livePost<ApiInspeksiP3k>('/p3k-inspections', body);

export const ubahInspeksiP3k = (
  id: string,
  body: { notes?: string; inspectionDate?: string; paraf?: string },
) => livePatch<ApiInspeksiP3k>(`/p3k-inspections/${id}`, body);

export const ubahButirP3k = (
  inspectionId: string,
  itemId: string,
  body: { actualQty?: number; status?: ApiStatusP3k },
) => livePatch<ApiButirP3k>(`/p3k-inspections/${inspectionId}/items/${itemId}`, body);

export const hapusInspeksiP3k = (id: string) => liveDelete(`/p3k-inspections/${id}`);

export interface MasukanLaporanPatroli {
  siteId: string;
  patrolDate: string;
}

export const buatLaporanPatroli = (body: MasukanLaporanPatroli) =>
  livePost<ApiLaporanPatroli>('/safety-patrol-reports', body);

export const buatTemuanPatroli = (
  reportId: string,
  body: { description: string; s3Key: string; locationNote?: string },
) => livePost<ApiTemuanPatroli>(`/safety-patrol-reports/${reportId}/findings`, body);

export type MasukanTemuan = { description: string; s3Key: string; locationNote?: string };

/**
 * Unggah foto temuan patroli (multipart: file, description, locationNote?).
 * Kontrak: POST /api/safety-patrol-reports/:id/findings/photo → 201 temuan.
 */
export const unggahFotoTemuanPatroli = (
  reportId: string,
  file: File,
  description: string,
  locationNote?: string,
) => {
  const form = new FormData();
  form.append('file', file);
  form.append('description', description);
  if (locationNote) form.append('locationNote', locationNote);
  return livePostForm<ApiTemuanPatroli>(
    `/safety-patrol-reports/${reportId}/findings/photo`,
    form,
  );
};

/** URL foto satu temuan via GET /api/safety-patrol-reports/findings/:fid/photo (302 presigned). */
export const urlFotoTemuanPatroli = (fid: string) =>
  `${liveApiBase()}/safety-patrol-reports/findings/${encodeURIComponent(fid)}/photo`;

export const hapusTemuanPatroli = (fid: string) =>
  liveDelete(`/safety-patrol-reports/findings/${fid}`);

export interface MasukanUnitHidran {
  siteId: string;
  zoneId: string;
  kode: string;
}

export const buatUnitHidran = (body: MasukanUnitHidran) =>
  livePost<ApiHydrantUnit>('/hydrant-units', body);

export interface MasukanUnitApar {
  siteId: string;
  zoneId: string;
  kode: string;
  tahun?: number;
  jenis?: ApiAparJenis;
  ukuran?: string;
  expiredDate: string;
}

export const buatUnitApar = (body: MasukanUnitApar) => livePost<ApiAparUnit>('/apar-units', body);

export const ubahUnitApar = (id: string, body: Partial<MasukanUnitApar>) =>
  livePatch<ApiAparUnit>(`/apar-units/${id}`, body);

export const hapusUnitApar = (id: string) => liveDelete(`/apar-units/${id}`);

export const ubahUnitHidran = (id: string, body: Partial<MasukanUnitHidran>) =>
  livePatch<ApiHydrantUnit>(`/hydrant-units/${id}`, body);

export const hapusUnitHidran = (id: string) => liveDelete(`/hydrant-units/${id}`);

export const buatZona = (body: { siteId: string; name: string }) =>
  livePost<ApiZone>('/zones', body);

export const hapusZona = (id: string) => liveDelete(`/zones/${id}`);

export interface ApiPerusahaan {
  id: string;
  name: string;
  createdAt: string;
}

export const ambilPerusahaan = () => ambilSemua<ApiPerusahaan>('/companies');

/** Proyek = organisasi + baris cermin companies (satu id). */
export const buatProyek = (nama: string) =>
  livePost<ApiPerusahaan>('/projects', { name: nama });

export const ubahProyek = (id: string, nama: string) =>
  livePatch<ApiPerusahaan>(`/projects/${id}`, { name: nama });

export const hapusProyek = (id: string) => liveDelete<{ ok: boolean }>(`/projects/${id}`);

export const hapusLokasi = (id: string) => liveDelete<{ ok: boolean }>(`/sites/${id}`);

export const buatKotakP3k = (body: { siteId: string; name: string }) =>
  livePost<ApiP3kBox>('/p3k-boxes', body);

// ── Foto (Garage via /api/uploads + /api/photos) ──

export interface ApiFoto {
  id: string;
  caption: string | null;
  /** `true` = foto catatan hasil temuan; `false` = bukti inspeksi. */
  temuan: boolean;
  mime: string | null;
  bytes: number | null;
}

/** Unggah foto inspeksi (multipart). Hanya untuk inspeksi hidran dan APAR. */
export const unggahFoto = (
  inspectionKind: 'hydrant' | 'apar',
  inspectionId: string,
  file: File,
  caption?: string,
  temuan = false,
) => {
  const form = new FormData();
  form.append('file', file);
  form.append('inspectionKind', inspectionKind);
  form.append('inspectionId', inspectionId);
  if (caption) form.append('caption', caption);
  form.append('temuan', temuan ? 'true' : 'false');
  return livePostForm<ApiFoto & { key: string }>('/uploads', form);
};

export const hapusFoto = (id: string) => liveDelete<{ ok: boolean }>(`/photos/${id}`);

/**
 * TODO(pekerja J): kontrak `GET /api/photos?inspectionKind=&inspectionId=`
 * (daftar foto satu inspeksi). Deklarasi tunggal di sini — bila bentuk
 * respons J berbeda (mis. penyertaan URL presigned), ubah hanya fungsi ini.
 */
export const ambilFotoInspeksi = (
  inspectionKind: 'hydrant' | 'apar',
  inspectionId: string,
) =>
  liveGet<{ items: ApiFoto[] }>(
    `/photos?inspectionKind=${inspectionKind}&inspectionId=${encodeURIComponent(inspectionId)}`,
  );

// ── Ekspor PDF (pdfJobs, v1 sinkron) ──

export type KategoriEkspor =
  | 'hydrant-monthly'
  | 'apar-monthly'
  | 'apar-card'
  | 'p3k-yearly'
  | 'patrol-report';

export interface ApiPdfJob {
  id: string;
  category: string;
  refId: string;
  status: 'queued' | 'done' | 'failed';
  createdAt: string;
  /** URL unduh presigned (60 dtk; hanya dapat dijangkau di dalam jaringan Docker). */
  downloadUrl: string | null;
}

/** Mulai ekspor PDF; v1 render sinkron, biasanya langsung berstatus done. */
export const eksporPdf = (category: KategoriEkspor, refId: string) =>
  livePost<{ id: string; category: string; status: string }>(`/export/${category}/${refId}`);

export const ambilPdfJob = (id: string) => liveGet<ApiPdfJob>(`/pdf-jobs/${id}`);
