import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APIErrorFilter } from './api-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalFilters(new APIErrorFilter());

  console.log(process.env)
  await app.listen(process.env.NODE_ENV == 'dev' ? 3000 : 80);
}
bootstrap();
