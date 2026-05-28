import { BadRequestException } from '@nestjs/common';
import { TariffRepository } from 'src/domain/tariff.repository';
import { TariffView } from './get-tariff.use-case';

export interface UpdateTariffInput {
  ratePerMinute: number;
  description?: string;
}

export class UpdateTariffUseCase {
  constructor(private readonly tariff: TariffRepository) {}

  async execute(input: UpdateTariffInput): Promise<TariffView> {
    const ratePerMinute = Number(input.ratePerMinute);
    if (!Number.isFinite(ratePerMinute) || ratePerMinute <= 0) {
      throw new BadRequestException(
        'El precio por minuto debe ser un número mayor a cero',
      );
    }

    const updated = await this.tariff.update({
      ratePerMinute,
      description: input.description,
    });

    return {
      ratePerMinute: updated.ratePerMinute,
      description: updated.description,
      currency: updated.currency,
    };
  }
}
