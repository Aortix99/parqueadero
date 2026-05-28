export type ActiveSessionSearchBy =
  | 'plate'
  | 'vehicleType'
  | 'clientEmail'
  | 'clientName';

export interface ActiveSessionFilters {
  search?: string;
  searchBy?: ActiveSessionSearchBy;
}
