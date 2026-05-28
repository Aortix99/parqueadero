import { ParkingSession } from 'src/domain/parking-session';
import { ParkingSessionRepository } from 'src/domain/parking-session.repository';

export class ListActiveSessionsUseCase {
  constructor(private readonly sessions: ParkingSessionRepository) {}

  async execute(): Promise<ParkingSession[]> {
    return this.sessions.listActive();
  }
}
