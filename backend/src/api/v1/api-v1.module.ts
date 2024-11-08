import { Module } from '@nestjs/common';
import { ApiV1Controller } from './api-v1.controller';
import { ApiV1Service } from './api-v1.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: process.env.NODE_ENV == 'dev' ? 1 : (5 * 60 * 1000),
    }),
  ],
  controllers: [ApiV1Controller],
  providers: [ApiV1Service],
})
export class ApiV1Module {}
