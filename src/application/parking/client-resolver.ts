import { BadRequestException } from '@nestjs/common';
import { Client, isValidEmail } from 'src/domain/client';
import { ClientRepository } from 'src/domain/client.repository';
import { ParkingSessionRepository } from 'src/domain/parking-session.repository';

export interface ResolvedClient {
  clientId: number;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface EntryClientInput {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

export class ClientResolver {
  constructor(
    private readonly clients: ClientRepository,
    private readonly sessions: ParkingSessionRepository,
  ) { }

  /** Ingreso: sin datos de cliente → reutiliza el de la última visita de la placa. */
  async resolveForEntry(
    plate: string,
    input: EntryClientInput,
  ): Promise<ResolvedClient | null> {
    const name = input.clientName?.trim();
    const email = input.clientEmail?.trim();
    const phone = input.clientPhone?.trim() || null;

    if (!name && !email && !phone) {
      return this.reuseLastClientForPlate(plate);
    }

    if (!name || !email) {
      throw new BadRequestException(
        'Para registrar el cliente debe indicar nombre y correo',
      );
    }

    if (!isValidEmail(email)) {
      throw new BadRequestException('Correo inválido');
    }

    return this.upsertByEmail(email, name, phone, plate);
  }

  /** Salida: enlaza o actualiza cliente sin duplicar por correo. */
  async upsertByEmail(
    email: string,
    name: string,
    phone: string | null,
    plate: string,
  ): Promise<ResolvedClient> {
    const byEmail = await this.clients.findByEmail(email);
    if (byEmail) {
      return this.updateAndReturn(byEmail, name, email, phone);
    }

    const last = await this.sessions.findLastCompletedByPlate(plate);
    if (last?.clientId) {
      const fromPlate = await this.clients.findById(last.clientId);
      if (fromPlate) {
        return this.updateAndReturn(fromPlate, name, email, phone);
      }
    }

    const saved = await this.clients.save(new Client(null, name, email, phone));
    return { clientId: saved.id!, name, email, phone };
  }

  private async reuseLastClientForPlate(
    plate: string,
  ): Promise<ResolvedClient | null> {
    const last = await this.sessions.findLastCompletedByPlate(plate);
    if (!last?.clientId) {
      return null;
    }

    const client = await this.clients.findById(last.clientId);
    if (!client) {
      return null;
    }

    return this.mapClient(client);
  }

  private async updateAndReturn(
    client: Client,
    name: string,
    email: string,
    phone: string | null,
  ): Promise<ResolvedClient> {
    client.name = name;
    client.email = email;
    if (phone) {
      client.phone = phone;
    }
    await this.clients.save(client);
    return { clientId: client.id!, name, email, phone };
  }

  private mapClient(client: Client): ResolvedClient {
    return {
      clientId: client.id!,
      name: client.name?.trim() || null,
      email: client.email?.trim() || null,
      phone: client.phone,
    };
  }
}
