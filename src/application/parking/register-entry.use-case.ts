import { ConflictException, BadRequestException } from '@nestjs/common';
import { ClientResolver } from 'src/application/parking/client-resolver';
import { ParkingSession } from 'src/domain/parking-session';
import { ParkingSessionRepository } from 'src/domain/parking-session.repository';
import { normalizePlate } from 'src/domain/plate.utils';
import { SessionStatus } from 'src/domain/session-status';
import { VehicleTypeRepository } from 'src/domain/vehicle-type.repository';
import { ClientRepository } from 'src/domain/client.repository';

export interface RegisterEntryInput {
  vehicleTypeId: number;
  plate: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

export interface RegisterEntryResult {
  sessionId: number;
  vehicleTypeId: number;
  vehicleTypeCode: string;
  vehicleTypeName: string;
  plate: string;
  clientId: number | null;
  entryAt: Date;
  status: SessionStatus;
}

export class RegisterEntryUseCase {
  private readonly clientResolver: ClientResolver;

  constructor(
    private readonly sessions: ParkingSessionRepository,
    private readonly vehicleTypes: VehicleTypeRepository,
    clients: ClientRepository,
  ) {
    this.clientResolver = new ClientResolver(clients, sessions);
  }

  async execute(input: RegisterEntryInput): Promise<RegisterEntryResult> {
    const vehicleType = await this.vehicleTypes.findById(input.vehicleTypeId);
    if (!vehicleType) {
      throw new BadRequestException('Tipo de vehículo inválido');
    }

    const plate = normalizePlate(input.plate);
    if (!plate) {
      throw new BadRequestException('Placa requerida');
    }

    const existing = await this.sessions.findActiveByPlate(plate);
    if (existing) {
      throw new ConflictException(
        `La placa ${plate} ya está registrada. Registre la salida antes de un nuevo ingreso.`,
      );
    }

    const resolved = await this.clientResolver.resolveForEntry(plate, input);
    const clientId = resolved?.clientId ?? null;
    const clientName =
      input.clientName?.trim() || resolved?.name || null;
    const clientEmail =
      input.clientEmail?.trim() || resolved?.email || null;
    const clientPhone =
      input.clientPhone?.trim() || resolved?.phone || null;

    const entryAt = new Date();
    const session = new ParkingSession(
      null,
      vehicleType.id,
      vehicleType.code,
      vehicleType.name,
      plate,
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      entryAt,
      null,
      null,
      null,
      null,
      SessionStatus.ACTIVE,
    );

    const saved = await this.sessions.save(session);
    return {
      sessionId: saved.id!,
      vehicleTypeId: saved.vehicleTypeId,
      vehicleTypeCode: saved.vehicleTypeCode,
      vehicleTypeName: saved.vehicleTypeName,
      plate: saved.plate,
      clientId: saved.clientId,
      entryAt: saved.entryAt,
      status: saved.status,
    };
  }
}
