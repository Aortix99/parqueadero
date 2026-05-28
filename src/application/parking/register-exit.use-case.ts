import { NotFoundException } from '@nestjs/common';
import { ClientResolver } from 'src/application/parking/client-resolver';
import { isValidEmail } from 'src/domain/client';
import { ClientRepository } from 'src/domain/client.repository';
import { ClientEmailRequiredException } from 'src/domain/exceptions/client-email-required.exception';
import { EmailNotificationGateway } from 'src/domain/email-notification.gateway';
import { ParkingFeeCalculator } from 'src/domain/parking-fee.calculator';
import { ParkingSession } from 'src/domain/parking-session';
import { ParkingSessionRepository } from 'src/domain/parking-session.repository';
import { normalizePlate } from 'src/domain/plate.utils';
import { SessionStatus } from 'src/domain/session-status';
import { TariffRepository } from 'src/domain/tariff.repository';

export interface RegisterExitInput {
  plate: string;
  clientName?: string;
  clientEmail?: string;
}

export interface RegisterExitResult {
  sessionId: number;
  plate: string;
  vehicleTypeCode: string;
  vehicleTypeName: string;
  entryAt: Date;
  exitAt: Date;
  durationMinutes: number;
  totalAmount: number;
  currency: string;
  ratePerMinute: number;
  emailSent: boolean;
}

export class RegisterExitUseCase {
  private readonly clientResolver: ClientResolver;

  constructor(
    private readonly sessions: ParkingSessionRepository,
    clients: ClientRepository,
    private readonly tariff: TariffRepository,
    private readonly emailGateway: EmailNotificationGateway,
  ) {
    this.clientResolver = new ClientResolver(clients, sessions);
  }

  async execute(input: RegisterExitInput): Promise<RegisterExitResult> {
    const plate = normalizePlate(input.plate);
    const session = await this.sessions.findActiveByPlate(plate);
    if (!session) {
      throw new NotFoundException('No hay ingreso activo para esta placa');
    }

    const recipientEmail = await this.resolveRecipientEmail(session, input);
    if (!recipientEmail) {
      throw new ClientEmailRequiredException();
    }

    const exitAt = new Date();
    const tariff = await this.tariff.getActive();
    const durationMinutes = ParkingFeeCalculator.durationMinutes(
      session.entryAt,
      exitAt,
    );
    const totalAmount = ParkingFeeCalculator.totalAmount(
      durationMinutes,
      tariff.ratePerMinute,
    );

    session.exitAt = exitAt;
    session.durationMinutes = durationMinutes;
    session.totalAmount = totalAmount;
    session.ratePerMinute = tariff.ratePerMinute;
    session.status = SessionStatus.COMPLETED;

    let emailSent = false;
    try {
      await this.emailGateway.sendExitNotification({
        sessionId: session.id!,
        to: recipientEmail,
        plate: session.plate,
        vehicleTypeCode: session.vehicleTypeCode,
        vehicleTypeName: session.vehicleTypeName,
        entryAt: session.entryAt,
        exitAt,
        durationMinutes,
        totalAmount,
        currency: tariff.currency,
      });
      session.emailSent = true;
      session.emailSentAt = new Date();
      emailSent = true;
    } catch {
      console.log('error al enviar correo');
    }

    await this.sessions.update(session);

    return {
      sessionId: session.id!,
      plate: session.plate,
      vehicleTypeCode: session.vehicleTypeCode,
      vehicleTypeName: session.vehicleTypeName,
      entryAt: session.entryAt,
      exitAt,
      durationMinutes,
      totalAmount,
      currency: tariff.currency,
      ratePerMinute: tariff.ratePerMinute,
      emailSent,
    };
  }

  private async resolveRecipientEmail(
    session: ParkingSession,
    input: RegisterExitInput,
  ): Promise<string | null> {
    const existing = session.clientEmail?.trim();
    if (existing && isValidEmail(existing)) {
      return existing;
    }

    const name = input.clientName?.trim();
    const email = input.clientEmail?.trim();
    if (!name || !email) {
      return null;
    }

    if (!isValidEmail(email)) {
      throw new ClientEmailRequiredException();
    }

    const resolved = await this.clientResolver.upsertByEmail(
      email,
      name,
      session.clientPhone,
      session.plate,
    );

    session.clientId = resolved.clientId;
    session.clientName = resolved.name;
    session.clientEmail = resolved.email;
    return resolved.email!;
  }
}
