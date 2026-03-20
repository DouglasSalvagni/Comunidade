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
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
const { PDFParse } = require('pdf-parse');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Initialize ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

interface IngestionJobData {
  type: 'lesson_text' | 'attachment' | 'video';
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
      } else if (job.data.type === 'video') {
        await this.processVideo(job.data);
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
    
    // Remove existing text knowledge for this lesson to avoid duplicates on update
    await this.knowledgeRepo.delete({
      lessonId: data.lessonId,
      type: 'text',
    });

    const chunks = this.openAiService.chunkText(cleanText);
    this.logger.log(`Split lesson text into ${chunks.length} chunks for embedding`);

    for (const chunk of chunks) {
      if (!chunk) continue;
      
      const embedding = await this.openAiService.generateEmbedding(chunk);

      const knowledge = this.knowledgeRepo.create({
        courseId: data.courseId,
        lessonId: data.lessonId,
        type: 'text',
        content: chunk,
        embedding: `[${embedding.join(',')}]`, // pgvector format
      });

      await this.knowledgeRepo.save(knowledge);
    }
    
    this.logger.log(`Saved text knowledge (${chunks.length} chunks) for lesson ${data.lessonId}`);
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

      // Remove existing attachment knowledge
      await this.knowledgeRepo.delete({
        lessonId: data.lessonId,
        type: 'attachment',
        // In a real scenario you might want to track attachmentId in LessonKnowledge to update specific ones
      });

      const chunks = this.openAiService.chunkText(cleanText);
      this.logger.log(`Split attachment text into ${chunks.length} chunks for embedding`);

      for (const chunk of chunks) {
        if (!chunk) continue;
        
        const embedding = await this.openAiService.generateEmbedding(chunk);

        const knowledge = this.knowledgeRepo.create({
          courseId: data.courseId,
          lessonId: data.lessonId,
          type: 'attachment',
          content: `File: ${attachment.fileName}\n\n${chunk}`,
          embedding: `[${embedding.join(',')}]`, // pgvector format
        });

        await this.knowledgeRepo.save(knowledge);
      }

      this.logger.log(`Saved PDF knowledge (${chunks.length} chunks) for attachment ${data.attachmentId}`);

    } catch (error) {
      this.logger.error(`Error processing attachment ${data.attachmentId}:`, error);
      throw error;
    }
  }

  private async processVideo(data: IngestionJobData) {
    const lesson = await this.lessonRepo.findOne({
      where: { id: data.lessonId },
      relations: ['modulo'],
    });

    if (!lesson || !lesson.videoKey) {
      this.logger.warn(`Lesson ${data.lessonId} not found or has no videoKey`);
      return;
    }

    const tempAudioPath = path.join(os.tmpdir(), `${uuidv4()}.mp3`);

    try {
      // 1. Get video URL
      const videoUrl = await this.storageService.generateViewUrl(lesson.videoKey);

      // 2. Extract audio using ffmpeg and save to temp file
      this.logger.log(`Extracting audio from video to ${tempAudioPath}...`);
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoUrl)
          .noVideo()
          .audioCodec('libmp3lame')
          .audioChannels(1)
          .audioFrequency(16000) // 16kHz is usually enough for Whisper and saves space
          .audioBitrate('32k') // 32kbps keeps 1 hour of audio ~14.4MB (well under 25MB limit)
          .output(tempAudioPath)
          .on('end', () => resolve())
          .on('error', (err: any) => reject(err))
          .run();
      });

      this.logger.log(`Audio extracted. Transcribing with OpenAI Whisper...`);
      
      // 3. Transcribe audio
      const transcript = await this.openAiService.transcribeAudio(tempAudioPath);
      
      if (!transcript || transcript.trim().length === 0) {
        this.logger.warn(`Transcription returned empty text for lesson ${data.lessonId}`);
        return;
      }

      this.logger.log(`Audio transcribed. Generating embeddings...`);

      // 4. Clean previous video embeddings
      await this.knowledgeRepo.delete({
        lessonId: data.lessonId,
        type: 'video',
      });

      // 5. Chunk text and generate embeddings for each chunk
      const chunks = this.openAiService.chunkText(transcript);
      this.logger.log(`Split transcript into ${chunks.length} chunks for embedding`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk) continue;

        const embedding = await this.openAiService.generateEmbedding(chunk);

        const knowledge = this.knowledgeRepo.create({
          courseId: data.courseId,
          lessonId: data.lessonId,
          type: 'video',
          content: chunk,
          embedding: `[${embedding.join(',')}]`, // pgvector format
        });

        await this.knowledgeRepo.save(knowledge);
      }

      this.logger.log(`Saved video transcript knowledge (${chunks.length} chunks) for lesson ${data.lessonId}`);

    } catch (error) {
      this.logger.error(`Error processing video for lesson ${data.lessonId}:`, error);
      throw error;
    } finally {
      // Cleanup temp file
      if (fs.existsSync(tempAudioPath)) {
        fs.unlinkSync(tempAudioPath);
      }
    }
  }
}
