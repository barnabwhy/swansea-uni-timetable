import { Controller, Get, Header, Param, UseInterceptors } from '@nestjs/common';
import { ApiV1Service } from './api-v1.service';
import '../../common/api-proxy';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('api/v1')
@UseInterceptors(CacheInterceptor)
export class ApiV1Controller {
  constructor(private readonly apiService: ApiV1Service) {}

  @Get()
  getRoot(): string {
    return this.apiService.getRoot();
  }

  @Get('types')
  @Header('Cache-Control', 'public, max-age=3600')
  getTypes() {
    return this.apiService.getTypes();
  }

  @Get('typesEx')
  @Header('Cache-Control', 'public, max-age=3600')
  getTypesEx() {
    return this.apiService.getTypesEx();
  }

  @Get('cats/:type/:page')
  @Header('Cache-Control', 'public, max-age=3600')
  getCats(@Param('type') type, @Param('page') page) {
    return this.apiService.getCats(type, parseInt(page));
  }

  @Get(':type/:cat')
  @Header('Cache-Control', 'public, max-age=300, stale-if-error=86400')
  getAllEvents(@Param('type') type, @Param('cat') cat) {
    return this.apiService.getAllEvents(type, cat);
  }

  @Get(':type/:cat/:weekOffset')
  @Header('Cache-Control', 'public, max-age=300, stale-if-error=86400')
  getWeekOffsetEvents(@Param('type') type, @Param('cat') cat, @Param('weekOffset') weekOffset) {
    return this.apiService.getWeekOffsetEvents(type, cat, weekOffset);
  }

  @Get(':type/:cat/week/:week')
  @Header('Cache-Control', 'public, max-age=300, stale-if-error=86400')
  getWeekNumberEvents(@Param('type') type, @Param('cat') cat, @Param('week') week) {
    return this.apiService.getWeekNumberEvents(type, cat, week);
  }

  @Get(':type/:cat/start/:weekStart')
  @Header('Cache-Control', 'public, max-age=300, stale-if-error=86400')
  getWeekStartEvents(@Param('type') type, @Param('cat') cat, @Param('weekStart') weekStart) {
    return this.apiService.getWeekStartEvents(type, cat, parseInt(weekStart));
  }
}
