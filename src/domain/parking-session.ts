import { SessionStatus } from './session-status';

export class ParkingSession {
  constructor(
    public id: number | null,
    public vehicleTypeId: number,
    public vehicleTypeCode: string,
    public vehicleTypeName: string,
    public plate: string,
    public clientId: number | null,
    public clientName: string | null,
    public clientEmail: string | null,
    public clientPhone: string | null,
    public entryAt: Date,
    public exitAt: Date | null,
    public durationMinutes: number | null,
    public totalAmount: number | null,
    public ratePerMinute: number | null,
    public status: SessionStatus,
    public emailSent = false,
    public emailSentAt: Date | null = null,
  ) {}
}
