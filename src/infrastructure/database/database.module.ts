import { Global, Module } from '@nestjs/common';
import { mysqlPoolProvider } from './mysql-pool.provider';

@Global()
@Module({
  providers: [mysqlPoolProvider],
  exports: [mysqlPoolProvider],
})
export class DatabaseModule {}
