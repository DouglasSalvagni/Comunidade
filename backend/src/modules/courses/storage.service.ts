import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucket: string;
  private cdnBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKey = this.configService.get<string>('S3_ACCESS_KEY');
    const secretKey = this.configService.get<string>('S3_SECRET_KEY');
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    this.bucket = this.configService.get<string>('S3_BUCKET') || 'videos';
    this.cdnBaseUrl = this.configService.get<string>('CDN_BASE_URL') || '';

    if (endpoint && accessKey && secretKey) {
      this.s3Client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        forcePathStyle: true,
      });
      this.logger.log('S3 storage client initialized');
    } else {
      this.logger.warn('S3 credentials not configured — storage operations will fail');
    }
  }

  private ensureClient(): S3Client {
    if (!this.s3Client) {
      throw new Error('S3 storage client not configured. Set S3_ENDPOINT, S3_ACCESS_KEY and S3_SECRET_KEY.');
    }
    return this.s3Client;
  }

  async deleteFile(key: string): Promise<void> {
    if (!key) return;
    try {
      const client = this.ensureClient();
      await client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file from S3: ${key}`, error);
      // We don't throw here to avoid blocking database deletion if S3 fails
    }
  }

  /**
   * Gera uma URL pré-assinada para upload direto (PUT) de um vídeo cru.
   * O front-end faz o upload direto para o bucket usando esta URL.
   */
  async generateUploadUrl(key: string, contentType = 'video/mp4'): Promise<{ uploadUrl: string; key: string }> {
    const client = this.ensureClient();
    const fullKey = `input/${key}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fullKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    return { uploadUrl, key: fullKey };
  }

  /**
   * Gera uma URL pré-assinada para visualização (GET) de um arquivo HLS.
   * Expira em 2 horas.
   */
  async generateViewUrl(key: string): Promise<string> {
    // Se temos CDN configurada, retorna URL pública via CDN
    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    const client = this.ensureClient();

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(client, command, { expiresIn: 7200 });
  }

  /**
   * Gera a URL para o manifesto HLS (master.m3u8) de um vídeo processado.
   */
  async getHlsManifestUrl(videoKey: string): Promise<string> {
    const hlsKey = `output/${videoKey}/master.m3u8`;
    return this.generateViewUrl(hlsKey);
  }

  /**
   * Gera uma URL pré-assinada para upload de um arquivo de apoio (PDF, etc.).
   */
  async generateAttachmentUploadUrl(
    key: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const client = this.ensureClient();
    const fullKey = `attachments/${key}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fullKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    return { uploadUrl, key: fullKey };
  }

  /**
   * Gera URL de download para um anexo.
   * Usa CDN se configurado; caso contrário, signed URL com Content-Disposition attachment.
   */
  async generateAttachmentDownloadUrl(key: string, fileName: string): Promise<string> {
    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    const client = this.ensureClient();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
    });

    return getSignedUrl(client, command, { expiresIn: 3600 });
  }

  async generateAttachmentForcedDownloadUrl(key: string, fileName: string): Promise<string> {
    const client = this.ensureClient();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
    });
    return getSignedUrl(client, command, { expiresIn: 3600 });
  }
}
