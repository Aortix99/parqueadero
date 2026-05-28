import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Client } from 'src/domain/client';
import { ClientRepository } from 'src/domain/client.repository';
import { MYSQL_POOL } from 'src/infrastructure/database/mysql-pool.provider';

interface ClientRow extends RowDataPacket {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
}

@Injectable()
export class NativeClientRepository implements ClientRepository {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async save(client: Client): Promise<Client> {
    if (client.id != null) {
      await this.pool.execute(
        'UPDATE clients SET name = ?, email = ?, phone = ? WHERE id = ?',
        [client.name, client.email, client.phone, client.id],
      );
      return client;
    }

    const [result] = await this.pool.execute<ResultSetHeader>(
      'INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)',
      [client.name, client.email, client.phone],
    );

    return new Client(result.insertId, client.name, client.email, client.phone);
  }

  async findById(id: number): Promise<Client | null> {
    const [rows] = await this.pool.execute<ClientRow[]>(
      'SELECT id, name, email, phone FROM clients WHERE id = ?',
      [id],
    );
    const row = rows[0];
    if (!row) return null;
    return new Client(row.id, row.name, row.email, row.phone);
  }

  async findByEmail(email: string): Promise<Client | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;

    const [rows] = await this.pool.execute<ClientRow[]>(
      'SELECT id, name, email, phone FROM clients WHERE LOWER(TRIM(email)) = ? LIMIT 1',
      [normalized],
    );
    const row = rows[0];
    if (!row) return null;
    return new Client(row.id, row.name, row.email, row.phone);
  }
}
