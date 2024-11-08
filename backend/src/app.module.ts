import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ApiMigrationModule } from './api/migrate-v1/migrate-v1.module';
import { ApiV1Module } from './api/v1/api-v1.module';
import { ApiV2Module } from './api/v2/api-v2.module';
import { AnalyticsMiddleware } from './analytics.middleware';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '..', 'frontend', 'dist'),
      exclude: ['api', '/api'],
    }),

    ApiV1Module,
    ApiV2Module,

    // Must be last
    ApiMigrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AnalyticsMiddleware)
      .forRoutes('api/*');
  }
}
