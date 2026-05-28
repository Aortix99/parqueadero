import { NotFoundException } from '@nestjs/common';
import { ParkingSession } from 'src/domain/parking-session';
import { ParkingSessionRepository } from 'src/domain/parking-session.repository';

export class GetSessionUseCase {
  constructor(private readonly sessions: ParkingSessionRepository) {}

  async execute(id: number): Promise<ParkingSession> {
    const session = await this.sessions.findById(id);
    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }
    return session;
  }
}
