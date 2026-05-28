export class ParkingFeeCalculator {
  static durationMinutes(entryAt: Date, exitAt: Date): number {
    const diffMs = exitAt.getTime() - entryAt.getTime();
    if (diffMs < 0) {
      throw new Error('La salida no puede ser anterior al ingreso');
    }
    return Math.max(1, Math.ceil(diffMs / 60_000));
  }

  static totalAmount(durationMinutes: number, ratePerMinute: number): number {
    return durationMinutes * ratePerMinute;
  }
}
