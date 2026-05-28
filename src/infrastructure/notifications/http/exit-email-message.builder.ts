import { ExitEmailPayload } from 'src/domain/email-notification.gateway';

function formatMoney(amount: number): string {
  const value = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(amount);
  return `$ ${value}`;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function buildExitEmailSubject(plate: string): string {
  return `Salida del vehículo — placa ${plate}`;
}

export function buildExitEmailMessage(payload: ExitEmailPayload): string {
  const tipo = payload.vehicleTypeName.trim() || payload.vehicleTypeCode.trim();
  const valor = formatMoney(payload.totalAmount);

  return [
    '<div style="font-family:Segoe UI,Arial,sans-serif;color:#0f172a;line-height:1.5;">',
    '<h2 style="margin:0 0 12px;">Salida de parqueadero</h2>',
    '<p>Se registró la salida de su vehículo con los siguientes datos:</p>',
    '<table style="border-collapse:collapse;width:100%;max-width:480px;">',
    `<tr><td style="padding:6px 8px;font-weight:600;">Placa</td><td style="padding:6px 8px;">${payload.plate}</td></tr>`,
    `<tr><td style="padding:6px 8px;font-weight:600;">Tipo de vehículo</td><td style="padding:6px 8px;">${tipo}</td></tr>`,
    `<tr><td style="padding:6px 8px;font-weight:600;">Tiempo total</td><td style="padding:6px 8px;">${payload.durationMinutes} minutos</td></tr>`,
    `<tr><td style="padding:6px 8px;font-weight:600;">Valor pagado</td><td style="padding:6px 8px;"><strong>${valor}</strong></td></tr>`,
    `<tr><td style="padding:6px 8px;font-weight:600;">Ingreso</td><td style="padding:6px 8px;">${formatDateTime(payload.entryAt)}</td></tr>`,
    `<tr><td style="padding:6px 8px;font-weight:600;">Salida</td><td style="padding:6px 8px;">${formatDateTime(payload.exitAt)}</td></tr>`,
    '</table>',
    '<p style="margin-top:16px;color:#64748b;font-size:13px;">Gracias por utilizar Parquin.</p>',
    '</div>',
  ].join('');
}

export function buildUniqueIdMessage(sessionId: number, exitAt: Date): string {
  return `parquin-exit-${sessionId}-${exitAt.getTime()}`;
}
