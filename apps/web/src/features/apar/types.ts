export type {
  AparUnitItem,
  AparYearCell,
  AparYearGrid,
  ReportWorkflowStatus,
} from '../../types/hse';

export interface AparFindingPhoto {
  kind: 'kartu' | 'berat' | 'cek';
  url: string;
}
