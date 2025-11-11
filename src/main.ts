import { setupSwagger } from '@doc/swagger';
import multipart from '@fastify/multipart';
import { LoggerFactory } from '@filter/error.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const configService = new ConfigService();
  const logger = new Logger(AppModule.name);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      cors: { origin: configService.get<string>('ALLOW_ORIGIN') ?? '*' },
      logger: LoggerFactory(),
      rawBody: true,
    },
  );

  if (configService.get<string>('ENV') === 'DEV') {
    setupSwagger(app);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const port = Number(configService.get<string>('PORT')) ?? 8000;
  const host = configService.get<string>('HOST') ?? '0.0.0.0';

  // Register the multipart plugin with the explicit Fastify instance type
  await app.register(multipart, {
    limits: {
      fileSize: 1024 * 1024 * 1024 * 1024 * 1024,
    },
  });

  await app.listen({ port, host }, () =>
    logger.log('Fair Point is running on port: ' + port),
  );
}

bootstrap();
