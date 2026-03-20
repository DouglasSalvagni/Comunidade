import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonKnowledge } from '../entities/lesson-knowledge.entity';
import { Lesson } from '@/modules/courses/entities/lesson.entity';
import { LessonAttachment } from '@/modules/courses/entities/lesson-attachment.entity';
import { OpenAiService } from '../services/openai.service';
import { StorageService } from '@/modules/courses/storage.service';
const { PDFParse } = require('pdf-parse');

interface IngestionJobData {
  type: 'lesson_text' | 'attachment';
  courseId: string;
  lessonId: string;
  attachmentId?: string;
}

@Processor('lesson-knowledge-ingestion')
export class LessonKnowledgeIngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(LessonKnowledgeIngestionProcessor.name);

  constructor(
    @InjectRepository(LessonKnowledge)
    private readonly knowledgeRepo: Repository<LessonKnowledge>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(LessonAttachment)
    private readonly attachmentRepo: Repository<LessonAttachment>,
    private readonly openAiService: OpenAiService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<IngestionJobData>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.data.type} for lesson ${job.data.lessonId}`);

    try {
      if (job.data.type === 'lesson_text') {
        await this.processLessonText(job.data);
      } else if (job.data.type === 'attachment') {
        await this.processAttachment(job.data);
      }
    } catch (error) {
      this.logger.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} is now active`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} has been completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }

  private async processLessonText(data: IngestionJobData) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: data.lessonId },
      relations: ['modulo'],
    });

    if (!lesson || !lesson.conteudoTexto) {
      this.logger.warn(`Lesson ${data.lessonId} not found or has no text content`);
      return;
    }

    // Strip HTML tags for cleaner embedding
    const cleanText = lesson.conteudoTexto.replace(/<[^>]*>?/gm, '');
    
    // In a real production scenario, you would chunk long texts here
    // For simplicity, we are embedding the whole text (assuming it fits in context window)
    const embedding = await this.openAiService.generateEmbedding(cleanText);

    // Remove existing text knowledge for this lesson to avoid duplicates on update
    await this.knowledgeRepo.delete({
      lessonId: data.lessonId,
      type: 'text',
    });

    const knowledge = this.knowledgeRepo.create({
      courseId: data.courseId,
      lessonId: data.lessonId,
      type: 'text',
      content: cleanText,
      embedding: `[${embedding.join(',')}]`, // pgvector format
    });

    await this.knowledgeRepo.save(knowledge);
    this.logger.log(`Saved text knowledge for lesson ${data.lessonId}`);
  }

  private async processAttachment(data: IngestionJobData) {
    if (!data.attachmentId) return;

    const attachment = await this.attachmentRepo.findOne({
      where: { id: data.attachmentId },
    });

    if (!attachment || attachment.contentType !== 'application/pdf') {
      this.logger.warn(`Attachment ${data.attachmentId} not found or not a PDF`);
      return;
    }

    try {
      // Download PDF from S3
      const downloadUrl = await this.storageService.generateAttachmentDownloadUrl(attachment.fileKey, attachment.fileName);
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Parse PDF
      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();
      const cleanText = pdfData.text.replace(/\s+/g, ' ').trim();

      if (!cleanText) {
        this.logger.warn(`No text extracted from PDF ${attachment.fileName}`);
        return;
      }

      // Generate embedding
      const embedding = await this.openAiService.generateEmbedding(cleanText);

      // Remove existing attachment knowledge
      await this.knowledgeRepo.delete({
        lessonId: data.lessonId,
        type: 'attachment',
        // In a real scenario you might want to track attachmentId in LessonKnowledge to update specific ones
      });

      const knowledge = this.knowledgeRepo.create({
        courseId: data.courseId,
        lessonId: data.lessonId,
        type: 'attachment',
        content: `File: ${attachment.fileName}\n\n${cleanText}`,
        embedding: `[${embedding.join(',')}]`, // pgvector format
      });

      await this.knowledgeRepo.save(knowledge);
      this.logger.log(`Saved PDF knowledge for attachment ${data.attachmentId}`);

    } catch (error) {
      this.logger.error(`Error processing attachment ${data.attachmentId}:`, error);
      throw error;
    }
  }
}
