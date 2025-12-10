import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Track } from '@/modules/catalog/entities/track.entity';
import * as Sharp from 'sharp';

@Injectable()
export class MediaService {
  private s3: AWS.S3;
  private bucket: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('transcode') private readonly transcodeQueue: Queue,
    @InjectRepository(Track) private readonly trackRepository: Repository<Track>,
  ) {
    this.s3 = new AWS.S3({
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
      secretAccessKey: this.configService.get<string>('S3_SECRET_KEY'),
      region: this.configService.get<string>('S3_REGION'),
      signatureVersion: 'v4',
      s3ForcePathStyle: true,
    });
    
    this.bucket = this.configService.get<string>('S3_BUCKET');
  }

  async getUploadUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
  ): Promise<{ uploadUrl: string; storageKey: string; expiresAt: Date }> {
    const key = `uploads/${uuidv4()}/${fileName}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // URL expira em 1 hora

    const params = {
      Bucket: this.bucket,
      Key: key,
      ContentType: fileType,
      Expires: 3600, // 1 hora em segundos
    };

    const uploadUrl = this.s3.getSignedUrl('putObject', params);

    return {
      uploadUrl,
      storageKey: key,
      expiresAt,
    };
  }

  async processMedia(
    storageKey: string,
    type: 'audio' | 'image' | 'video',
    workId?: string,
  ): Promise<{ processedUrl: string; metadata: any }> {
    if (type === 'audio') {
      console.log(`[MediaService] Attempting to add job to transcode queue for storageKey: ${storageKey}`);
      try {
        const job = await this.transcodeQueue.add('audio', { storageKey, workId });
        console.log(`[MediaService] Job added successfully to transcode queue. Job ID: ${job.id}`);
      } catch (error) {
        console.error(`[MediaService] Failed to add job to transcode queue for storageKey: ${storageKey}`, error);
      }
      return { processedUrl: this.getCdnUrl(storageKey), metadata: { queued: true } };
    }

    if (type === 'image') {
      const original = await this.s3.getObject({ Bucket: this.bucket, Key: storageKey }).promise();
      const buf = original.Body as Buffer;

      const cover600 = await (Sharp as any)(buf).resize(600, 600, { fit: 'cover' }).jpeg({ quality: 75 }).toBuffer();
      const thumb300 = await (Sharp as any)(buf).resize(300, 300, { fit: 'cover' }).jpeg({ quality: 75 }).toBuffer();

      const dir = storageKey.split('/').slice(0, -1).join('/');
      const key600 = `${dir}/cover_600.jpg`;
      const key300 = `${dir}/cover_300.jpg`;

      const cache = 'public,max-age=2592000,immutable';
      await this.s3.upload({ Bucket: this.bucket, Key: key600, Body: cover600, ContentType: 'image/jpeg', CacheControl: cache }).promise();
      await this.s3.upload({ Bucket: this.bucket, Key: key300, Body: thumb300, ContentType: 'image/jpeg', CacheControl: cache }).promise();

      try { await this.s3.deleteObject({ Bucket: this.bucket, Key: storageKey }).promise(); } catch { }

      return {
        processedUrl: this.getCdnUrl(key600),
        metadata: { queued: false, thumbUrl: this.getCdnUrl(key300), deletedOriginal: true },
      };
    }

    return { processedUrl: this.getCdnUrl(storageKey), metadata: { queued: false } };
  }

  async deleteMedia(storageKey: string): Promise<void> {
    const params = {
      Bucket: this.bucket,
      Key: storageKey,
    };

    await this.s3.deleteObject(params).promise();
  }

  async deletePrefix(prefix: string): Promise<void> {
    const listed = await this.s3.listObjectsV2({ Bucket: this.bucket, Prefix: prefix }).promise();
    if (!listed.Contents || listed.Contents.length === 0) return;
    const objects = listed.Contents.map((o) => ({ Key: o.Key as string }));
    await this.s3.deleteObjects({ Bucket: this.bucket, Delete: { Objects: objects } }).promise();
  }

  getStorageKeyFromUrl(url: string): string | null {
    const cdn = this.configService.get<string>('CDN_BASE_URL') || '';
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || '';
    const bucket = this.bucket || '';
    if (cdn && url.startsWith(cdn)) {
      const base = cdn.replace(/\/$/, '');
      const rest = url.slice(base.length);
      return rest.replace(/^\//, '') || null;
    }
    const s3Base = `${endpoint.replace(/\/$/, '')}/${bucket}`;
    if (endpoint && bucket && url.startsWith(s3Base)) {
      const rest = url.slice(s3Base.length);
      return rest.replace(/^\//, '') || null;
    }
    return null;
  }

  getCdnUrl(storageKey: string): string {
    const base = this.configService.get<string>('CDN_BASE_URL');
    if (base) return `${base.replace(/\/$/, '')}/${storageKey}`;
    return `${this.configService.get<string>('S3_ENDPOINT')}/${this.bucket}/${storageKey}`;
  }

  async getHlsKey(trackId: string): Promise<string | null> {
    const track = await this.trackRepository.findOne({ where: { id: trackId } });
    if (!track || !track.hlsEncrypted) return null;
    return track.hlsEncryptionKey || null;
  }

  async getHlsKeyRaw(trackId: string): Promise<Buffer | null> {
    const track = await this.trackRepository.findOne({ where: { id: trackId } });
    if (!track || !track.hlsEncrypted || !track.hlsEncryptionKey) return null;
    try {
      const hex = track.hlsEncryptionKey;
      const buf = Buffer.from(hex, 'hex');
      return buf;
    } catch {
      return null;
    }
  }
}
