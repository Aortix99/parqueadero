import { VehicleTypeRecord } from './vehicle-type-record';

export interface VehicleTypeRepository {
  listActive(): Promise<VehicleTypeRecord[]>;
  findById(id: number): Promise<VehicleTypeRecord | null>;
}
