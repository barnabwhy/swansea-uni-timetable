import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ApiMigrationModule } from './api/migrate-v1/migrate-v1.module';
import { ApiV1Module } from './api/v1/api-v1.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
      exclude: ['api'],
    }),

    ApiV1Module,

    // Must be last
    ApiMigrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
