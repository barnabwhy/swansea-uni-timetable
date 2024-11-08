import { Module } from '@nestjs/common';
import { ApiV2Controller } from './api-v2.controller';
import { ApiV2Service } from './api-v2.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: process.env.NODE_ENV == 'dev' ? 1 : (5 * 60 * 1000),
    }),
  ],
  controllers: [ApiV2Controller],
  providers: [ApiV2Service],
})
export class ApiV2Module {}
