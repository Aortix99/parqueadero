import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2/promise';
import { VehicleTypeRecord } from 'src/domain/vehicle-type-record';
import { VehicleTypeRepository } from 'src/domain/vehicle-type.repository';
import { MYSQL_POOL } from 'src/infrastructure/database/mysql-pool.provider';

interface VehicleTypeRow extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  is_active: number;
}

@Injectable()
export class NativeVehicleTypeRepository implements VehicleTypeRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async listActive(): Promise<VehicleTypeRecord[]> {
    const [rows] = await this.pool.execute<VehicleTypeRow[]>(
      'SELECT id, code, name, is_active FROM vehicle_types WHERE is_active = 1 ORDER BY name ASC',
    );
    return rows.map(
      (row) =>
        new VehicleTypeRecord(row.id, row.code, row.name, row.is_active === 1),
    );
  }

  async findById(id: number): Promise<VehicleTypeRecord | null> {
    const [rows] = await this.pool.execute<VehicleTypeRow[]>(
      'SELECT id, code, name, is_active FROM vehicle_types WHERE id = ? AND is_active = 1',
      [id],
    );
    const row = rows[0];
    if (!row) return null;
    return new VehicleTypeRecord(row.id, row.code, row.name, row.is_active === 1);
  }
}
