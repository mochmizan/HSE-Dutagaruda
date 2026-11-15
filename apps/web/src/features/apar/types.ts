export type {
  AparUnitItem,
  AparYearCell,
  AparYearGrid,
} from '../../types/hse';

export interface AparFindingItem {
  id: string;
  imageUrl: string;
  description: string;
  unitCode?: string;
  createdAt?: string;
}

export interface AparFindingPhoto {
  kind: 'kartu' | 'berat' | 'cek';
  url: string;
}
