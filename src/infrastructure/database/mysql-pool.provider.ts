import { Provider } from '@nestjs/common';
import { createPool, Pool } from 'mysql2/promise';

export const MYSQL_POOL = Symbol('MYSQL_POOL');

export const mysqlPoolProvider: Provider = {
  provide: MYSQL_POOL,
  useFactory: (): Pool =>
    createPool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME ?? 'parquin',
      waitForConnections: true,
      connectionLimit: 10,
    }),
};
