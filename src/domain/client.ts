export class Client {
  constructor(
    public id: number | null,
    public name: string | null,
    public email: string | null,
    public phone: string | null,
  ) {}
}

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.includes('@') && trimmed.includes('.');
}
