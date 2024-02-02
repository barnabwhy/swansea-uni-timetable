import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APIErrorFilter } from './api-error.filter';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import compression from '@fastify/compress';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(compression, {
    encodings: ['gzip', 'deflate'],
  });

  app.enableCors();
  app.useGlobalFilters(new APIErrorFilter());

  await app.listen(process.env.NODE_ENV == 'dev' ? 3000 : 80);
}
bootstrap();
