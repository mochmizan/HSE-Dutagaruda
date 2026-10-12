export type {
  AparUnitItem,
  AparYearCell,
  AparYearGrid,
} from '../../types/hse';

export interface AparFindingPhoto {
  kind: 'kartu' | 'berat' | 'cek';
  url: string;
}
