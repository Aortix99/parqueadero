import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { RegisterEntryUseCase } from 'src/application/parking/register-entry.use-case';

import { RegisterExitUseCase } from 'src/application/parking/register-exit.use-case';

import { GetSessionUseCase } from 'src/application/parking/get-session.use-case';

import { ListActiveSessionsPaginatedUseCase } from 'src/application/parking/list-active-sessions-paginated.use-case';

import { ListSessionsPaginatedUseCase } from 'src/application/parking/list-sessions-paginated.use-case';

import { ListVehicleTypesUseCase } from 'src/application/parking/list-vehicle-types.use-case';

import { GetTariffUseCase } from 'src/application/parking/get-tariff.use-case';

import { UpdateTariffUseCase } from 'src/application/parking/update-tariff.use-case';

import { ParkingSession } from 'src/domain/parking-session';

import type { ParkingSessionRepository } from 'src/domain/parking-session.repository';

import {
  RegisterEntryDto,
  RegisterExitDto,
  UpdateTariffDto,
} from './parking.dto';

import {
  GET_SESSION,
  GET_TARIFF,
  LIST_ACTIVE_SESSIONS_PAGINATED,
  LIST_SESSIONS_PAGINATED,
  LIST_VEHICLE_TYPES,
  PARKING_SESSION_REPOSITORY,
  REGISTER_ENTRY,
  REGISTER_EXIT,
  UPDATE_TARIFF,
} from './tokens';

function mapSessionToDto(s: ParkingSession) {
  return {
    id: s.id,

    vehicleTypeId: s.vehicleTypeId,

    vehicleTypeCode: s.vehicleTypeCode,

    vehicleTypeName: s.vehicleTypeName,

    plate: s.plate,

    clientId: s.clientId,

    clientName: s.clientName,

    clientEmail: s.clientEmail,

    clientPhone: s.clientPhone,

    entryAt: s.entryAt,

    exitAt: s.exitAt,

    durationMinutes: s.durationMinutes,

    totalAmount: s.totalAmount,

    ratePerMinute: s.ratePerMinute,

    status: s.status,
  };
}

@Controller('parking')
export class ParkingController {
  constructor(
    @Inject(REGISTER_ENTRY)
    private readonly registerEntry: RegisterEntryUseCase,

    @Inject(REGISTER_EXIT) private readonly registerExit: RegisterExitUseCase,

    @Inject(GET_SESSION) private readonly getSession: GetSessionUseCase,

    @Inject(LIST_ACTIVE_SESSIONS_PAGINATED)
    private readonly listActivePaginated: ListActiveSessionsPaginatedUseCase,

    @Inject(PARKING_SESSION_REPOSITORY)
    private readonly parkingSessionRepo: ParkingSessionRepository,

    @Inject(LIST_SESSIONS_PAGINATED)
    private readonly listPaginated: ListSessionsPaginatedUseCase,

    @Inject(GET_TARIFF) private readonly getTariff: GetTariffUseCase,

    @Inject(UPDATE_TARIFF) private readonly updateTariff: UpdateTariffUseCase,

    @Inject(LIST_VEHICLE_TYPES)
    private readonly listVehicleTypes: ListVehicleTypesUseCase,
  ) {}

  @Get('vehicle-types')
  async listVehicleTypesHandler() {
    const types = await this.listVehicleTypes.execute();

    return types.map((t) => ({
      id: t.id,

      code: t.code,

      name: t.name,
    }));
  }

  @Get('tariff')
  getTariffHandler() {
    return this.getTariff.execute();
  }

  @Put('tariff')
  updateTariffHandler(@Body() body: UpdateTariffDto) {
    return this.updateTariff.execute(body);
  }

  @Post('entry')
  @HttpCode(HttpStatus.CREATED)
  registerEntryHandler(@Body() body: RegisterEntryDto) {
    return this.registerEntry.execute(body);
  }

  @Post('exit')
  registerExitHandler(@Body() body: RegisterExitDto) {
    return this.registerExit.execute(body);
  }

  @Get('sessions')
  async listSessionsHandler(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,

    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    const result = await this.listPaginated.execute(page, limit);

    return {
      ...result,

      items: result.items.map(mapSessionToDto),
    };
  }

  @Get('sessions/:id')
  async getSessionHandler(@Param('id', ParseIntPipe) id: number) {
    const session = await this.getSession.execute(id);

    return mapSessionToDto(session);
  }

  @Get('active/check')
  async checkActivePlateHandler(@Query('plate') plate: string) {
    const normalized = (plate ?? '').trim().toUpperCase().replace(/\s+/g, '');

    if (!normalized) {
      return { active: false, hasClientEmail: false };
    }

    const existing =
      await this.parkingSessionRepo.findActiveByPlate(normalized);

    const email = existing?.clientEmail?.trim() ?? '';

    return {
      active: !!existing,

      hasClientEmail: email.length > 0 && email.includes('@'),
    };
  }

  @Get('active')
  async listActiveHandler(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('searchBy') searchBy?: string,
  ) {
    const result = await this.listActivePaginated.execute(page, limit, {
      search,
      searchBy: searchBy as
        | 'plate'
        | 'vehicleType'
        | 'clientEmail'
        | 'clientName'
        | undefined,
    });

    return {
      items: result.items.map(mapSessionToDto),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      ratePerMinute: result.ratePerMinute,
      currency: result.currency,
    };
  }
}
