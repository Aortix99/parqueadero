import { TariffRepository } from 'src/domain/tariff.repository';

export interface TariffView {
  ratePerMinute: number;
  description: string;
  currency: string;
}

export class GetTariffUseCase {
  constructor(private readonly tariff: TariffRepository) {}

  async execute(): Promise<TariffView> {
    const config = await this.tariff.getActive();
    return {
      ratePerMinute: config.ratePerMinute,
      description: config.description,
      currency: config.currency,
    };
  }
}
