import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { bootstrapTranscodeWorker } from './transcode.worker';

async function bootstrap() {
    // Start NestJS worker (for Play Events)
    const app = await NestFactory.createApplicationContext(WorkerModule);
    console.log('[WORKER_LOG] NestJS Worker Application Context started.');

    // Start Legacy Transcode Worker
    await bootstrapTranscodeWorker();
}
bootstrap();
