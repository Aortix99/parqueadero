export interface ExitEmailPayload {
  sessionId: number;
  to: string;
  plate: string;
  vehicleTypeCode: string;
  vehicleTypeName: string;
  entryAt: Date;
  exitAt: Date;
  durationMinutes: number;
  totalAmount: number;
  currency: string;
}

export interface EmailNotificationGateway {
  sendExitNotification(payload: ExitEmailPayload): Promise<void>;
}
