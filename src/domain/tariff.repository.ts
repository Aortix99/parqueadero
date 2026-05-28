export interface TariffConfig {
  id: number;
  ratePerMinute: number;
  description: string;
  currency: string;
}

export interface TariffUpdate {
  ratePerMinute: number;
  description?: string;
}

export interface TariffRepository {
  getActive(): Promise<TariffConfig>;
  update(data: TariffUpdate): Promise<TariffConfig>;
}
