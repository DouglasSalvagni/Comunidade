import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { bootstrapTranscodeWorker } from './transcode.worker';

async function bootstrap() {
    console.log('[WORKER_LOG] Starting worker bootstrap...');

    // Start NestJS worker (for Play Events)
    console.log('[WORKER_LOG] Creating NestJS Application Context for PlayEventsProcessor...');
    const app = await NestFactory.createApplicationContext(WorkerModule);
    console.log('[WORKER_LOG] NestJS Worker Application Context started - PlayEventsProcessor should be active now.');

    // Start Legacy Transcode Worker
    console.log('[WORKER_LOG] Starting Transcode Worker...');
    await bootstrapTranscodeWorker();
    console.log('[WORKER_LOG] Both workers are now running.');
}
bootstrap().catch(err => {
    console.error('[WORKER_LOG] Fatal error during bootstrap:', err);
    process.exit(1);
});
