import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APIErrorFilter } from './api-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalFilters(new APIErrorFilter());

  await app.listen(3000);
}
bootstrap();
