export const MINUTES_PER_HOUR = 60;

export function ratePerHourFromMinute(ratePerMinute: number): number {
  return ratePerMinute * MINUTES_PER_HOUR;
}

export function ratePerMinuteFromHour(ratePerHour: number): number {
  return ratePerHour / MINUTES_PER_HOUR;
}
