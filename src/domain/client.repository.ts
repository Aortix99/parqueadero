import { Client } from './client';

export interface ClientRepository {
  save(client: Client): Promise<Client>;
  findById(id: number): Promise<Client | null>;
  findByEmail(email: string): Promise<Client | null>;
}
