import { ActiveSessionFilters } from './active-session-filters';
import { PaginatedResult } from './paginated-result';
import { ParkingSession } from './parking-session';

export interface ParkingSessionRepository {
  save(session: ParkingSession): Promise<ParkingSession>;
  findActiveByPlate(plate: string): Promise<ParkingSession | null>;
  findLastCompletedByPlate(plate: string): Promise<ParkingSession | null>;
  findById(id: number): Promise<ParkingSession | null>;
  update(session: ParkingSession): Promise<void>;
  listActive(): Promise<ParkingSession[]>;
  listPaginated(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ParkingSession>>;
  listActivePaginated(
    page: number,
    limit: number,
    filters?: ActiveSessionFilters,
  ): Promise<PaginatedResult<ParkingSession>>;
}
