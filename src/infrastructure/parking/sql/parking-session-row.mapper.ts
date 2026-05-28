import { ParkingSession } from 'src/domain/parking-session';
import { SessionStatus } from 'src/domain/session-status';
import { RowDataPacket } from 'mysql2';

export interface ParkingSessionRow extends RowDataPacket {
  id: number;
  vehicle_type_id: number;
  vehicle_type_code: string;
  vehicle_type_name: string;
  client_id: number | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  plate: string;
  rate_per_minute: string | null;
  entry_at: Date;
  exit_at: Date | null;
  duration_minutes: number | null;
  total_amount: string | null;
  status: SessionStatus;
  email_sent: number;
  email_sent_at: Date | null;
}

export const SESSION_FROM_JOIN = `
  FROM parking_sessions s
  INNER JOIN vehicle_types vt ON vt.id = s.vehicle_type_id
  LEFT JOIN clients c ON c.id = s.client_id
`;

export const SESSION_SELECT = `
  SELECT
    s.id,
    s.vehicle_type_id,
    s.client_id,
    s.plate,
    s.rate_per_minute,
    s.entry_at,
    s.exit_at,
    s.duration_minutes,
    s.total_amount,
    s.status,
    s.email_sent,
    s.email_sent_at,
    vt.code AS vehicle_type_code,
    vt.name AS vehicle_type_name,
    c.name AS client_name,
    c.email AS client_email,
    c.phone AS client_phone
  ${SESSION_FROM_JOIN}
`;

export function mapSessionRow(row: ParkingSessionRow): ParkingSession {
  return new ParkingSession(
    row.id,
    row.vehicle_type_id,
    row.vehicle_type_code,
    row.vehicle_type_name,
    row.plate,
    row.client_id,
    row.client_name,
    row.client_email,
    row.client_phone,
    row.entry_at,
    row.exit_at,
    row.duration_minutes,
    row.total_amount != null ? Number(row.total_amount) : null,
    row.rate_per_minute != null ? Number(row.rate_per_minute) : null,
    row.status,
    row.email_sent === 1,
    row.email_sent_at,
  );
}
