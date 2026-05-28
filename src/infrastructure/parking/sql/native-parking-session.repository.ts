import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { ActiveSessionFilters } from 'src/domain/active-session-filters';
import { PaginatedResult } from 'src/domain/paginated-result';
import { ParkingSession } from 'src/domain/parking-session';
import { ParkingSessionRepository } from 'src/domain/parking-session.repository';
import { SessionStatus } from 'src/domain/session-status';
import { MYSQL_POOL } from 'src/infrastructure/database/mysql-pool.provider';
import {
  mapSessionRow,
  ParkingSessionRow,
  SESSION_FROM_JOIN,
  SESSION_SELECT,
} from './parking-session-row.mapper';

interface CountRow extends RowDataPacket {
  total: number;
}

function pagination(limit: number, offset: number): { limit: number; offset: number } {
  return {
    limit: Math.max(1, Math.min(100, Math.trunc(limit) || 1)),
    offset: Math.max(0, Math.trunc(offset) || 0),
  };
}

@Injectable()
export class NativeParkingSessionRepository implements ParkingSessionRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async save(session: ParkingSession): Promise<ParkingSession> {
    if (session.id != null) {
      await this.pool.execute(
        `UPDATE parking_sessions SET
          client_id = ?,
          vehicle_type_id = ?,
          plate = ?,
          rate_per_minute = ?,
          entry_at = ?,
          exit_at = ?,
          duration_minutes = ?,
          total_amount = ?,
          status = ?,
          email_sent = ?,
          email_sent_at = ?
        WHERE id = ?`,
        [
          session.clientId,
          session.vehicleTypeId,
          session.plate,
          session.ratePerMinute,
          session.entryAt,
          session.exitAt,
          session.durationMinutes,
          session.totalAmount,
          session.status,
          session.emailSent ? 1 : 0,
          session.emailSentAt,
          session.id,
        ],
      );
      return (await this.findById(session.id))!;
    }

    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO parking_sessions (
        client_id, vehicle_type_id, plate, rate_per_minute,
        entry_at, exit_at, duration_minutes, total_amount, status,
        email_sent, email_sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.clientId,
        session.vehicleTypeId,
        session.plate,
        session.ratePerMinute,
        session.entryAt,
        session.exitAt,
        session.durationMinutes,
        session.totalAmount,
        session.status,
        session.emailSent ? 1 : 0,
        session.emailSentAt,
      ],
    );

    return (await this.findById(result.insertId))!;
  }

  async findActiveByPlate(plate: string): Promise<ParkingSession | null> {
    const [rows] = await this.pool.execute<ParkingSessionRow[]>(
      `${SESSION_SELECT} WHERE s.plate = ? AND s.status = ? LIMIT 1`,
      [plate, SessionStatus.ACTIVE],
    );
    const row = rows[0];
    return row ? mapSessionRow(row) : null;
  }

  async findLastCompletedByPlate(plate: string): Promise<ParkingSession | null> {
    const [rows] = await this.pool.execute<ParkingSessionRow[]>(
      `${SESSION_SELECT}
       WHERE s.plate = ? AND s.status = ?
       ORDER BY s.exit_at DESC, s.entry_at DESC
       LIMIT 1`,
      [plate, SessionStatus.COMPLETED],
    );
    const row = rows[0];
    return row ? mapSessionRow(row) : null;
  }

  async findById(id: number): Promise<ParkingSession | null> {
    const [rows] = await this.pool.execute<ParkingSessionRow[]>(
      `${SESSION_SELECT} WHERE s.id = ? LIMIT 1`,
      [id],
    );
    const row = rows[0];
    return row ? mapSessionRow(row) : null;
  }

  async update(session: ParkingSession): Promise<void> {
    await this.save(session);
  }

  async listActive(): Promise<ParkingSession[]> {
    const [rows] = await this.pool.execute<ParkingSessionRow[]>(
      `${SESSION_SELECT} WHERE s.status = ? ORDER BY s.entry_at DESC`,
      [SessionStatus.ACTIVE],
    );
    return rows.map(mapSessionRow);
  }

  async listPaginated(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ParkingSession>> {
    const { limit: take, offset: skip } = pagination(
      limit,
      (page - 1) * limit,
    );

    const [countRows] = await this.pool.execute<CountRow[]>(
      'SELECT COUNT(*) AS total FROM parking_sessions',
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.execute<ParkingSessionRow[]>(
      `${SESSION_SELECT} ORDER BY s.entry_at DESC, s.id DESC LIMIT ${take} OFFSET ${skip}`,
    );

    return {
      items: rows.map(mapSessionRow),
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async listActivePaginated(
    page: number,
    limit: number,
    filters?: ActiveSessionFilters,
  ): Promise<PaginatedResult<ParkingSession>> {
    const { limit: take, offset: skip } = pagination(
      limit,
      (page - 1) * limit,
    );
    const { clause, params } = this.buildActiveFilterClause(filters);
    const where = `WHERE s.status = ?${clause}`;
    const baseParams: (string | number)[] = [SessionStatus.ACTIVE, ...params];

    const [countRows] = await this.pool.execute<CountRow[]>(
      `SELECT COUNT(*) AS total ${SESSION_FROM_JOIN} ${where}`,
      baseParams,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.execute<ParkingSessionRow[]>(
      `${SESSION_SELECT} ${where} ORDER BY s.entry_at DESC, s.id DESC LIMIT ${take} OFFSET ${skip}`,
      baseParams,
    );

    return {
      items: rows.map(mapSessionRow),
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  private buildActiveFilterClause(filters?: ActiveSessionFilters): {
    clause: string;
    params: string[];
  } {
    if (!filters?.search?.trim()) {
      return { clause: '', params: [] };
    }

    const term = `%${filters.search.trim()}%`;
    const searchBy = filters.searchBy ?? 'plate';

    switch (searchBy) {
      case 'plate':
        return { clause: ' AND s.plate LIKE ?', params: [term] };
      case 'vehicleType':
        return { clause: ' AND vt.name LIKE ?', params: [term] };
      case 'clientEmail':
        return { clause: ' AND c.email LIKE ?', params: [term] };
      case 'clientName':
        return { clause: ' AND c.name LIKE ?', params: [term] };
      default:
        return { clause: '', params: [] };
    }
  }
}
