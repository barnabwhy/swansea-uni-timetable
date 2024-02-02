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

  const port = process.env.NODE_ENV == 'dev' ? 3000 : 80;
  console.log(`Listening on 0.0.0.0:${port}`);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
