import { VehicleTypeRecord } from 'src/domain/vehicle-type-record';
import { VehicleTypeRepository } from 'src/domain/vehicle-type.repository';

export class ListVehicleTypesUseCase {
  constructor(private readonly vehicleTypes: VehicleTypeRepository) {}

  execute(): Promise<VehicleTypeRecord[]> {
    return this.vehicleTypes.listActive();
  }
}
