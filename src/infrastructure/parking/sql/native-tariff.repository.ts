import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import {
  TariffConfig,
  TariffRepository,
  TariffUpdate,
} from 'src/domain/tariff.repository';
import { MYSQL_POOL } from 'src/infrastructure/database/mysql-pool.provider';

interface TariffRow extends RowDataPacket {
  id: number;
  description: string;
  price_per_minute: string;
}

const DEFAULT_TARIFF: TariffConfig = {
  id: 0,
  ratePerMinute: 50,
  description: 'Cobro por minuto de permanencia',
  currency: 'USD',
};

@Injectable()
export class NativeTariffRepository implements TariffRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async getActive(): Promise<TariffConfig> {
    const [rows] = await this.pool.execute<TariffRow[]>(
      'SELECT id, description, price_per_minute FROM tariff_rates WHERE is_active = 1 ORDER BY id DESC LIMIT 1',
    );
    const row = rows[0];
    if (!row) return DEFAULT_TARIFF;
    return {
      id: row.id,
      ratePerMinute: Number(row.price_per_minute),
      description: row.description,
      currency: 'USD',
    };
  }

  async update(data: TariffUpdate): Promise<TariffConfig> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        'UPDATE tariff_rates SET is_active = 0 WHERE is_active = 1',
      );
      const description =
        data.description?.trim() || 'Cobro por minuto de permanencia';
      const [result] = await conn.execute<ResultSetHeader>(
        'INSERT INTO tariff_rates (description, price_per_minute, is_active) VALUES (?, ?, 1)',
        [description, String(data.ratePerMinute)],
      );
      await conn.commit();
      return {
        id: result.insertId,
        ratePerMinute: data.ratePerMinute,
        description,
        currency: 'USD',
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
