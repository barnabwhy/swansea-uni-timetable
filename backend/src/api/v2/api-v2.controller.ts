import {
  Controller,
  Get,
  Header,
  Param,
  StreamableFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiV2Service } from './api-v2.service';
import '../../common/api-proxy';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('api/v2')
@UseInterceptors(CacheInterceptor)
export class ApiV2Controller {
  constructor(private readonly apiService: ApiV2Service) {}

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

  @Get(':type/:cat/start/:weekStart')
  @Header('Cache-Control', 'public, max-age=300, stale-if-error=86400')
  getWeekStartEvents(
    @Param('type') type,
    @Param('cat') cat,
    @Param('weekStart') weekStart,
  ) {
    return this.apiService.getWeekStartEvents(type, cat, parseInt(weekStart));
  }

  @Get('cats/:type')
  @Header('Cache-Control', 'public, max-age=3600')
  @Header('Content-Type', 'application/json')
  getCats(@Param('type') type): StreamableFile {
    return this.apiService.getCats(type);
  }
}
