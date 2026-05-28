import { Module } from '@nestjs/common';
import { RegisterEntryUseCase } from 'src/application/parking/register-entry.use-case';
import { RegisterExitUseCase } from 'src/application/parking/register-exit.use-case';
import { GetSessionUseCase } from 'src/application/parking/get-session.use-case';
import { ListActiveSessionsPaginatedUseCase } from 'src/application/parking/list-active-sessions-paginated.use-case';
import { ListSessionsPaginatedUseCase } from 'src/application/parking/list-sessions-paginated.use-case';
import { ListVehicleTypesUseCase } from 'src/application/parking/list-vehicle-types.use-case';
import { GetTariffUseCase } from 'src/application/parking/get-tariff.use-case';
import { UpdateTariffUseCase } from 'src/application/parking/update-tariff.use-case';
import { ClientRepository } from 'src/domain/client.repository';
import { ParkingSessionRepository } from 'src/domain/parking-session.repository';
import { TariffRepository } from 'src/domain/tariff.repository';
import { VehicleTypeRepository } from 'src/domain/vehicle-type.repository';
import { EmailNotificationGateway } from 'src/domain/email-notification.gateway';
import { EmailApiGateway } from 'src/infrastructure/notifications/http/email-api.gateway';
import { NativeClientRepository } from '../sql/native-client.repository';
import { NativeParkingSessionRepository } from '../sql/native-parking-session.repository';
import { NativeTariffRepository } from '../sql/native-tariff.repository';
import { NativeVehicleTypeRepository } from '../sql/native-vehicle-type.repository';
import { HealthController } from './health.controller';
import { ParkingController } from './parking.controller';
import {
  CLIENT_REPOSITORY,
  EMAIL_NOTIFICATION_GATEWAY,
  GET_SESSION,
  LIST_ACTIVE_SESSIONS_PAGINATED,
  LIST_SESSIONS_PAGINATED,
  LIST_VEHICLE_TYPES,
  GET_TARIFF,
  UPDATE_TARIFF,
  PARKING_SESSION_REPOSITORY,
  REGISTER_ENTRY,
  REGISTER_EXIT,
  TARIFF_REPOSITORY,
  VEHICLE_TYPE_REPOSITORY,
} from './tokens';

@Module({
  controllers: [ParkingController, HealthController],
  providers: [
    {
      provide: PARKING_SESSION_REPOSITORY,
      useClass: NativeParkingSessionRepository,
    },
    { provide: CLIENT_REPOSITORY, useClass: NativeClientRepository },
    { provide: VEHICLE_TYPE_REPOSITORY, useClass: NativeVehicleTypeRepository },
    { provide: TARIFF_REPOSITORY, useClass: NativeTariffRepository },
    { provide: EMAIL_NOTIFICATION_GATEWAY, useClass: EmailApiGateway },
    {
      provide: REGISTER_ENTRY,
      useFactory: (
        sessions: ParkingSessionRepository,
        vehicleTypes: VehicleTypeRepository,
        clients: ClientRepository,
      ) => new RegisterEntryUseCase(sessions, vehicleTypes, clients),
      inject: [
        PARKING_SESSION_REPOSITORY,
        VEHICLE_TYPE_REPOSITORY,
        CLIENT_REPOSITORY,
      ],
    },
    {
      provide: REGISTER_EXIT,
      useFactory: (
        sessions: ParkingSessionRepository,
        clients: ClientRepository,
        tariff: TariffRepository,
        email: EmailNotificationGateway,
      ) => new RegisterExitUseCase(sessions, clients, tariff, email),
      inject: [
        PARKING_SESSION_REPOSITORY,
        CLIENT_REPOSITORY,
        TARIFF_REPOSITORY,
        EMAIL_NOTIFICATION_GATEWAY,
      ],
    },
    {
      provide: GET_SESSION,
      useFactory: (repo: ParkingSessionRepository) => new GetSessionUseCase(repo),
      inject: [PARKING_SESSION_REPOSITORY],
    },
    {
      provide: LIST_ACTIVE_SESSIONS_PAGINATED,
      useFactory: (
        repo: ParkingSessionRepository,
        tariff: TariffRepository,
      ) => new ListActiveSessionsPaginatedUseCase(repo, tariff),
      inject: [PARKING_SESSION_REPOSITORY, TARIFF_REPOSITORY],
    },
    {
      provide: LIST_SESSIONS_PAGINATED,
      useFactory: (repo: ParkingSessionRepository) =>
        new ListSessionsPaginatedUseCase(repo),
      inject: [PARKING_SESSION_REPOSITORY],
    },
    {
      provide: LIST_VEHICLE_TYPES,
      useFactory: (repo: VehicleTypeRepository) =>
        new ListVehicleTypesUseCase(repo),
      inject: [VEHICLE_TYPE_REPOSITORY],
    },
    {
      provide: GET_TARIFF,
      useFactory: (tariff: TariffRepository) => new GetTariffUseCase(tariff),
      inject: [TARIFF_REPOSITORY],
    },
    {
      provide: UPDATE_TARIFF,
      useFactory: (tariff: TariffRepository) => new UpdateTariffUseCase(tariff),
      inject: [TARIFF_REPOSITORY],
    },
  ],
})
export class ParkingModule {}
