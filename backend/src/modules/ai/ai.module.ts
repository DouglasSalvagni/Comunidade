import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { LessonKnowledge } from './entities/lesson-knowledge.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatSummary } from './entities/chat-summary.entity';
import { OpenAiService } from './services/openai.service';
import { Lesson } from '@/modules/courses/entities/lesson.entity';
import { LessonAttachment } from '@/modules/courses/entities/lesson-attachment.entity';
import { StorageService } from '@/modules/courses/storage.service';

import { LessonKnowledgeIngestionProcessor } from './processors/lesson-knowledge-ingestion.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LessonKnowledge,
      ChatMessage,
      ChatSummary,
      Lesson,
      LessonAttachment,
    ]),
    BullModule.registerQueue({
      name: 'lesson-knowledge-ingestion',
    }),
  ],
  controllers: [],
  providers: [OpenAiService, StorageService, LessonKnowledgeIngestionProcessor],
  exports: [OpenAiService, BullModule],
})
export class AiModule {}
