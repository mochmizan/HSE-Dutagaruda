/**
 * Klien endpoint API HSE — bentuk respons dideklarasikan eksplisit di sini
 * (batas sistem), lalu dipercaya di seluruh aplikasi.
 *
 * Catatan: klien RPC `hc<AppType>` dari apps/api belum membawa tipe rute
 * (AppType = BlankSchema karena registrasi rute tidak dirantai), sehingga
 * pemanggilan memakai fetch + deklarasi tipe di berkas ini.
 */

import { liveGet, livePost, livePatch, liveDelete } from './liveClient';

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
  notes: string | null;
  createdAt: string;
}

export interface ApiInspeksiP3k {
  id: string;
  companyId: string;
  boxId: string;
  period: string;
  notes: string | null;
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
  hidran: Array<ApiInspeksiHidran & { category: 'hidran' }>;
  apar: Array<ApiInspeksiApar & { category: 'apar' }>;
  p3k: Array<ApiInspeksiP3k & { category: 'p3k' }>;
  patroli: Array<ApiLaporanPatroli & { category: 'patroli' }>;
}

// ── Permintaan ──

export const ambilLokasi = () => liveGet<Halaman<ApiSite>>('/sites?limit=100');

export const ambilZona = () => liveGet<Halaman<ApiZone>>('/zones?limit=100');

export const ambilUnitHidran = () => liveGet<Halaman<ApiHydrantUnit>>('/hydrant-units?limit=100');

export const ambilUnitApar = () => liveGet<Halaman<ApiAparUnit>>('/apar-units?limit=100');

export const ambilKotakP3k = () => liveGet<Halaman<ApiP3kBox>>('/p3k-boxes?limit=100');

export const ambilInspeksiHidran = () =>
  liveGet<Halaman<ApiInspeksiHidran>>('/hydrant-inspections?limit=100');

export const ambilInspeksiApar = () =>
  liveGet<Halaman<ApiInspeksiApar>>('/apar-inspections?limit=100');

export const ambilInspeksiP3k = () =>
  liveGet<Halaman<ApiInspeksiP3k>>('/p3k-inspections?limit=100');

export const ambilButirP3k = (inspectionId: string) =>
  liveGet<ApiInspeksiP3k>(`/p3k-inspections/${inspectionId}`);

export const ambilLaporanPatroli = () =>
  liveGet<Halaman<ApiLaporanPatroli>>('/safety-patrol-reports?limit=100');

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
  notes?: string;
}

export const buatInspeksiHidran = (body: MasukanInspeksiHidran) =>
  livePost<ApiInspeksiHidran>('/hydrant-inspections', body);

export const ubahInspeksiHidran = (
  id: string,
  body: Partial<Omit<MasukanInspeksiHidran, 'unitId' | 'month'>>,
) => livePatch<ApiInspeksiHidran>(`/hydrant-inspections/${id}`, body);

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
  notes?: string;
}

export const buatInspeksiApar = (body: MasukanInspeksiApar) =>
  livePost<ApiInspeksiApar>('/apar-inspections', body);

export const ubahInspeksiApar = (
  id: string,
  body: Partial<Omit<MasukanInspeksiApar, 'unitId' | 'month'>>,
) => livePatch<ApiInspeksiApar>(`/apar-inspections/${id}`, body);

export const buatInspeksiP3k = (body: { boxId: string; month: string; notes?: string }) =>
  livePost<ApiInspeksiP3k>('/p3k-inspections', body);

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

export const ubahUnitHidran = (id: string, body: Partial<MasukanUnitHidran>) =>
  livePatch<ApiHydrantUnit>(`/hydrant-units/${id}`, body);

export const buatZona = (body: { siteId: string; name: string }) =>
  livePost<ApiZone>('/zones', body);

export interface ApiPerusahaan {
  id: string;
  name: string;
  createdAt: string;
}

export const ambilPerusahaan = () => liveGet<Halaman<ApiPerusahaan>>('/companies?limit=10');

export const buatKotakP3k = (body: { siteId: string; name: string }) =>
  livePost<ApiP3kBox>('/p3k-boxes', body);
