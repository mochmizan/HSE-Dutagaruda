export type {
  HydrantComponentStatus,
  AparComponentStatus,
  P3kItemStatus,
  OverallStatus,
} from './domain';

export type InspectionCategory = 'HYDRANT' | 'APAR' | 'P3K' | 'SAFETY_PATROL';

export interface InspectionReport {
  id: string;
  category: InspectionCategory;
  date: string; // ISO date YYYY-MM-DD or full timestamp
  period: string; // e.g. "2026-09"
  siteId: string;
  siteName: string;
  zoneName: string;
  assetCode: string; // e.g. "Hydrant 1", "APAR 04", "Kotak P3K Utama"
  inspectorName: string;
  overallStatus: import('./domain').OverallStatus;
  summaryNotes?: string;
  tindakLanjut?: string;
  photoUrl?: string;
  photoTimestamp?: string;
  // Specific details
  hydrantDetails?: {
    boxHydrant: import('./domain').HydrantComponentStatus;
    fireHose: import('./domain').HydrantComponentStatus;
    hoseCoupling: import('./domain').HydrantComponentStatus;
    hoseRack: import('./domain').HydrantComponentStatus;
    nozzle: import('./domain').HydrantComponentStatus;
    valvePillar: import('./domain').HydrantComponentStatus;
  };
  aparDetails?: {
    jenis: 'POWDER' | 'CO2' | 'FOAM';
    ukuran: string;
    expiredDate: string;
    tanggalRefill?: string;
    beratCo2Kg?: number;
    safetyPin: import('./domain').AparComponentStatus;
    corong: import('./domain').AparComponentStatus;
    segel: import('./domain').AparComponentStatus;
    tekanan: import('./domain').AparComponentStatus;
    tabung: import('./domain').AparComponentStatus;
    selang: import('./domain').AparComponentStatus;
    katupTuas: import('./domain').AparComponentStatus;
  };
  p3kDetails?: {
    boxName: string;
    itemsTotal: number;
    itemsUnderStandard: number;
    needsRestock: boolean;
  };
  patrolDetails?: {
    findingsCount: number;
    criticalCount: number;
    locationNote: string;
  };
}

export interface AparUnitExpiry {
  id: string;
  kode: string;
  zona: string;
  jenis: string;
  ukuran?: string;
  expiredDate: string;
  daysRemaining: number;
  isUrgent?: boolean;
}

export interface SiteSummary {
  id: string;
  name: string;
  clientName: string;
  address: string;
  zones: string[];
}

export interface CategoryMeta {
  label: string;
  labelIndo: string;
  name: string;
  colorHex: string;
  bgTint: string;
  borderTint: string;
  badgeColor: string;
  bgBadge: string;
  icon: string;
  description: string;
}

export const CATEGORY_CONFIG: Record<InspectionCategory, CategoryMeta> = {
  HYDRANT: {
    label: 'Inspeksi Hydrant',
    labelIndo: 'Pemeriksaan Hydrant',
    name: 'Hydrant',
    colorHex: '#eb5757',
    bgTint: 'rgba(235, 87, 87, 0.12)',
    borderTint: 'rgba(235, 87, 87, 0.25)',
    badgeColor: '#eb5757',
    bgBadge: 'rgba(235, 87, 87, 0.12)',
    icon: 'Flame',
    description: 'Pemeriksaan fisik kotak, selang, nozzle, dan kran valve hydrant gedung',
  },
  APAR: {
    label: 'Inspeksi APAR',
    labelIndo: 'Pemeriksaan APAR',
    name: 'APAR',
    colorHex: '#f2994a',
    bgTint: 'rgba(242, 153, 74, 0.12)',
    borderTint: 'rgba(242, 153, 74, 0.25)',
    badgeColor: '#f2994a',
    bgBadge: 'rgba(242, 153, 74, 0.12)',
    icon: 'ShieldCheck',
    description: 'Pemeriksaan tekanan tabung, pin segel, corong, dan masa kadaluarsa APAR',
  },
  P3K: {
    label: 'Kotak P3K',
    labelIndo: 'Pemeriksaan Kotak P3K',
    name: 'Kotak P3K',
    colorHex: '#27ae60',
    bgTint: 'rgba(39, 174, 96, 0.12)',
    borderTint: 'rgba(39, 174, 96, 0.25)',
    badgeColor: '#27ae60',
    bgBadge: 'rgba(39, 174, 96, 0.12)',
    icon: 'BriefcaseMedical',
    description: 'Pemeriksaan kelengkapan 21 item standar obat & perban kotak P3K (Tipe A, B, C)',
  },
  SAFETY_PATROL: {
    label: 'Safety Patrol',
    labelIndo: 'Safety Patrol (K3)',
    name: 'Safety Patrol',
    colorHex: '#2f80ed',
    bgTint: 'rgba(47, 128, 237, 0.12)',
    borderTint: 'rgba(47, 128, 237, 0.25)',
    badgeColor: '#2f80ed',
    bgBadge: 'rgba(47, 128, 237, 0.12)',
    icon: 'Eye',
    description: 'Walkthrough temuan potensi bahaya, unsafe action, dan unsafe condition',
  },
};

export type HydrantInspectionStatus = 'BELUM_DIPERIKSA' | 'SEDANG_BERJALAN' | 'SELESAI';

export interface HydrantUnitItem {
  id: string;
  kode: string;
  siteId: string;
  zoneId: string;
  zoneName: string;
  status: HydrantInspectionStatus;
  period: string; // e.g. "2026-09"
  lastInspectionDate?: string;
  scheduledDate?: string;
  inspectorName?: string;
  componentsCheckedCount: number; // 0 to 6
  componentsTotal: number; // 6
  draftDetails?: {
    boxHydrant?: import('./domain').HydrantComponentStatus;
    fireHose?: import('./domain').HydrantComponentStatus;
    hoseCoupling?: import('./domain').HydrantComponentStatus;
    hoseRack?: import('./domain').HydrantComponentStatus;
    nozzle?: import('./domain').HydrantComponentStatus;
    valvePillar?: import('./domain').HydrantComponentStatus;
    notes?: string;
    tindakLanjut?: string;
    photoUrl?: string;
    photoTimestamp?: string;
    overallStatus?: import('./domain').OverallStatus;
  };
  completedReport?: InspectionReport;
}

export type AparInspectionStatus = 'BELUM_DIPERIKSA' | 'SEDANG_BERJALAN' | 'SELESAI';

export interface AparUnitItem {
  id: string;
  kode: string;
  siteId: string;
  zoneId: string;
  zoneName: string;
  status: AparInspectionStatus;
  period: string;
  lastInspectionDate?: string;
  scheduledDate?: string;
  inspectorName?: string;
  jenis: 'POWDER' | 'CO2';
  ukuran: string;
  tahunPembuatan: number;
  tanggalRefill?: string;
  expiredDate: string;
  beratCo2Kg?: number;
  componentsCheckedCount: number;
  componentsTotal: number;
  draftDetails?: {
    safetyPin?: import('./domain').AparComponentStatus;
    corong?: import('./domain').AparComponentStatus;
    segel?: import('./domain').AparComponentStatus;
    tekanan?: import('./domain').AparComponentStatus;
    tabung?: import('./domain').AparComponentStatus;
    selang?: import('./domain').AparComponentStatus;
    katupTuas?: import('./domain').AparComponentStatus;
    notes?: string;
    photoKartuUrl?: string;
    photoBeratUrl?: string;
    photoPengecekanUrl?: string;
    photoTimestamp?: string;
    overallStatus?: import('./domain').OverallStatus;
    tindakLanjut?: string;
    tanggalPemeriksaan?: string;
    namaPemeriksa?: string;
    paraf?: string;
  };
  completedReport?: InspectionReport;
}

export interface AparYearCell {
  tanggal: string;
  kondisi: {
    safetyPin: string;
    corong: string;
    segel: string;
    tekanan: string;
    tabung: string;
    selang: string;
    katupTuas: string;
  };
  nama: string;
  paraf: string;
  tindakLanjut?: string;
}

export type AparYearGrid = Record<string, AparYearCell>;
