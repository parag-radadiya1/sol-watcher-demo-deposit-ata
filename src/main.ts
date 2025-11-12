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
import { setupBullBoard } from '@app/queue/bull-board.setup';
import { QueueService } from '@app/queue/queue.service';
import { IoAdapter } from '@nestjs/platform-socket.io';

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

  // Enable Socket.IO WebSocket adapter for Fastify
  app.useWebSocketAdapter(new IoAdapter(app));

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

  // Optional: setup Bull Board dashboard if enabled via environment
  // MUST be before app.listen() - Fastify doesn't allow plugin registration after boot
  const enableBullBoard = configService.get<string>('ENABLE_BULL_BOARD') ?? process.env.ENABLE_BULL_BOARD;

  if (enableBullBoard && ['1', 'true', 'yes'].includes(String(enableBullBoard).toLowerCase())) {
    try {
      const queueService = app.get<QueueService>(QueueService);
      await setupBullBoard(app, queueService);
    } catch (err) {
      logger.error('Failed to initialize Bull Board', err?.message || err);
    }
  }

  await app.listen({ port, host }, () =>
    logger.log('Fair Point is running on port: ' + port),
  );
}

bootstrap();

