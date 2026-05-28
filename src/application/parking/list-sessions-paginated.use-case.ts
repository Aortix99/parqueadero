import { BadRequestException } from '@nestjs/common';
import { PaginatedResult } from 'src/domain/paginated-result';
import { ParkingSession } from 'src/domain/parking-session';
import { ParkingSessionRepository } from 'src/domain/parking-session.repository';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

export class ListSessionsPaginatedUseCase {
  constructor(private readonly sessions: ParkingSessionRepository) {}

  async execute(
    page = 1,
    limit = DEFAULT_LIMIT,
  ): Promise<PaginatedResult<ParkingSession>> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(MAX_LIMIT, Math.max(1, limit));

    if (!Number.isFinite(safePage) || !Number.isFinite(safeLimit)) {
      throw new BadRequestException('Parámetros de paginación inválidos');
    }

    return this.sessions.listPaginated(safePage, safeLimit);
  }
}
