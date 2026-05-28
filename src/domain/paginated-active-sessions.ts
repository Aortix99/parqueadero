import { PaginatedResult } from './paginated-result';
import { ParkingSession } from './parking-session';

export interface PaginatedActiveSessions extends PaginatedResult<ParkingSession> {
  ratePerMinute: number;
  currency: string;
}
