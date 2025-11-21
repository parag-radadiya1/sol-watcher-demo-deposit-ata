// File created: setup Bull Board dashboard for Fastify (optional)
// Attempts to import bull-board packages at runtime. If they are missing, it logs instructions.
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { Queue } from 'bullmq';
import type { QueueService } from './queue.service';
import { Logger } from '@nestjs/common';

export async function setupBullBoard(app: NestFastifyApplication, queueService: QueueService) {
  const logger = new Logger('BullBoard');

  try {
    const { createBullBoard } = await import('@bull-board/api');
    const { BullMQAdapter } = await import('@bull-board/api/bullMQAdapter');
    const { FastifyAdapter } = await import('@bull-board/fastify');

    const serverAdapter = new FastifyAdapter();
    // set base path for the UI
    serverAdapter.setBasePath('/admin/queues');

    // Collect queues to monitor
    const queues: any[] = [];
    const astrologyQueue: Queue = queueService.getAstrologyQueue();
    const birthstoneQueue: Queue = queueService.getBirthstoneQueue()
    if (astrologyQueue) {
      queues.push(new BullMQAdapter(astrologyQueue));
      queues.push(new BullMQAdapter(birthstoneQueue));
    }

    createBullBoard({ queues, serverAdapter });

    // Register the bull-board fastify plugin
    await app.register((serverAdapter as any).registerPlugin(), { prefix: '/admin/queues' });

    logger.log('Bull Board dashboard registered at /admin/queues');
  } catch (err) {
    // If packages aren't installed or the adapter API differs, log a helpful message
    // Don't throw so the app still starts.
    // eslint-disable-next-line no-console
    console.warn(
      'Could not register Bull Board dashboard. To enable it, install: @bull-board/api @bull-board/fastify and @bull-board/ui and set ENABLE_BULL_BOARD=true',
      err?.message || err,
    );
  }
}
