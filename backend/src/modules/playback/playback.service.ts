import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayEvent } from './entities/play-event.entity';
import { Download } from './entities/download.entity';
import { SubscriptionsService } from '@/modules/subscriptions/subscriptions.service';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
// removed duplicate imports
import { Track } from '@/modules/catalog/entities/track.entity';

@Injectable()
export class PlaybackService {
  private s3: AWS.S3;

  constructor(
    @InjectRepository(PlayEvent)
    private readonly playEventRepository: Repository<PlayEvent>,
    @InjectRepository(Download)
    private readonly downloadRepository: Repository<Download>,
    @InjectRepository(Track)
    private readonly trackRepository: Repository<Track>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {
    // Configurar S3
    this.s3 = new AWS.S3({
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
      secretAccessKey: this.configService.get<string>('S3_SECRET_KEY'),
      region: this.configService.get<string>('S3_REGION'),
      signatureVersion: 'v4',
      s3ForcePathStyle: true,
    });
  }

  async getStreamingUrl(trackId: string, userId: string, format: 'hls' | 'original' = 'hls'): Promise<{ url: string; expiresAt: Date }> {

    const track = await this.trackRepository.findOne({ where: { id: trackId } });
    if (!track) {
      throw new NotFoundException('Track not found');
    }
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    const preferOriginal = format === 'original';
    const masterKey = track.hlsMasterKey || track.hlsManifestStorageKey;
    const cdnBase = (this.configService.get<string>('CDN_BASE_URL') || '').replace(/\/$/, '');
    if (masterKey && !preferOriginal) {
      if (cdnBase) {
        return { url: `${cdnBase}/${masterKey}`, expiresAt };
      }
      const url = this.s3.getSignedUrl('getObject', {
        Bucket: this.configService.get<string>('S3_BUCKET'),
        Key: masterKey,
        Expires: 600,
      });
      return { url, expiresAt };
    }
    if (track.storageKey) {
      if (cdnBase) {
        return { url: `${cdnBase}/${track.storageKey}`, expiresAt };
      }
      const url = this.s3.getSignedUrl('getObject', {
        Bucket: this.configService.get<string>('S3_BUCKET'),
        Key: track.storageKey,
        Expires: 600,
      });
      return { url, expiresAt };
    }
    return { url: track.audioUrl, expiresAt };
  }

  async recordPlayEvent(
    trackId: string,
    eventType: 'play' | 'pause' | 'complete' | 'seek',
    positionSeconds: number,
    userId: string,
    profileId?: string,
  ): Promise<PlayEvent> {
    // Verificar se o usuário tem acesso
    const hasAccess = await this.subscriptionsService.checkSubscriptionAccess(userId);
    
    if (!hasAccess) {
      throw new ForbiddenException('Subscription required for playback');
    }

    const playEvent = this.playEventRepository.create({
      track: { id: trackId },
      eventType,
      positionSeconds,
      profile: profileId ? { id: profileId } : null,
    });

    return this.playEventRepository.save(playEvent);
  }

  async getPlayHistory(userId: string, profileId?: string, limit = 50): Promise<PlayEvent[]> {
    const queryBuilder = this.playEventRepository
      .createQueryBuilder('playEvent')
      .leftJoinAndSelect('playEvent.track', 'track')
      .leftJoinAndSelect('track.work', 'work')
      .where('playEvent.userId = :userId', { userId })
      .orderBy('playEvent.createdAt', 'DESC')
      .take(limit);

    if (profileId) {
      queryBuilder.andWhere('playEvent.profileId = :profileId', { profileId });
    }

    return queryBuilder.getMany();
  }

  async downloadTrack(trackId: string, userId: string, profileId: string, deviceId: string): Promise<{ downloadId: string; url: string }> {
    // Verificar se o usuário tem assinatura premium (offline downloads)
    const limits = await this.subscriptionsService.getSubscriptionLimits(userId);
    
    if (!limits.hdQuality || limits.offlineDownloads === 0) {
      throw new ForbiddenException('Premium subscription required for offline downloads');
    }

    // Verificar limite de downloads
    const currentDownloads = await this.downloadRepository.count({
      where: { profileId },
    });

    if (currentDownloads >= limits.offlineDownloads) {
      throw new ForbiddenException('Offline download limit reached');
    }

    // Criar registro de download
    const licenseExpiresAt = new Date();
    licenseExpiresAt.setDate(licenseExpiresAt.getDate() + 30); // Licença válida por 30 dias

    const download = this.downloadRepository.create({
      trackId,
      profileId,
      deviceId,
      licenseExpiresAt,
    });

    const savedDownload = await this.downloadRepository.save(download);

    // Gerar URL de download (mock por enquanto)
    return {
      downloadId: savedDownload.id,
      url: `https://cdn.example.com/downloads/${trackId}/audio.mp3?download=true&token=mock-token`,
    };
  }

  async getDownloads(profileId: string): Promise<Download[]> {
    return this.downloadRepository
      .createQueryBuilder('download')
      .leftJoinAndSelect('download.track', 'track')
      .leftJoinAndSelect('track.work', 'work')
      .where('download.profileId = :profileId', { profileId })
      .andWhere('download.licenseExpiresAt > :now', { now: new Date() })
      .orderBy('download.createdAt', 'DESC')
      .getMany();
  }

  async removeDownload(downloadId: string, profileId: string): Promise<void> {
    const download = await this.downloadRepository.findOne({
      where: { id: downloadId, profileId },
    });

    if (!download) {
      throw new NotFoundException('Download not found');
    }

    await this.downloadRepository.remove(download);
  }
}
