import { BadRequestException } from '@nestjs/common';
import {
  ActiveSessionFilters,
  ActiveSessionSearchBy,
} from 'src/domain/active-session-filters';
import { PaginatedActiveSessions } from 'src/domain/paginated-active-sessions';
import { ParkingSessionRepository } from 'src/domain/parking-session.repository';
import { TariffRepository } from 'src/domain/tariff.repository';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;
const SEARCH_BY_VALUES: ActiveSessionSearchBy[] = [
  'plate',
  'vehicleType',
  'clientEmail',
  'clientName',
];

export class ListActiveSessionsPaginatedUseCase {
  constructor(
    private readonly sessions: ParkingSessionRepository,
    private readonly tariff: TariffRepository,
  ) {}

  async execute(
    page = 1,
    limit = DEFAULT_LIMIT,
    filters?: ActiveSessionFilters,
  ): Promise<PaginatedActiveSessions> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(MAX_LIMIT, Math.max(1, limit));

    if (!Number.isFinite(safePage) || !Number.isFinite(safeLimit)) {
      throw new BadRequestException('Parámetros de paginación inválidos');
    }

    const normalizedFilters = this.normalizeFilters(filters);
    const [result, tariff] = await Promise.all([
      this.sessions.listActivePaginated(safePage, safeLimit, normalizedFilters),
      this.tariff.getActive(),
    ]);

    return {
      ...result,
      ratePerMinute: tariff.ratePerMinute,
      currency: tariff.currency,
    };
  }

  private normalizeFilters(
    filters?: ActiveSessionFilters,
  ): ActiveSessionFilters | undefined {
    if (!filters) return undefined;

    const search = filters.search?.trim();
    if (!search) return undefined;

    const searchBy = filters.searchBy ?? 'plate';
    if (!SEARCH_BY_VALUES.includes(searchBy)) {
      throw new BadRequestException('Criterio de búsqueda inválido');
    }

    return { search, searchBy };
  }
}
