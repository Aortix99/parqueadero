export class RegisterEntryDto {
  vehicleTypeId: number;
  plate: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

export class RegisterExitDto {
  plate: string;
  clientName?: string;
  clientEmail?: string;
}

export class UpdateTariffDto {
  ratePerMinute: number;
  description?: string;
}
