console.log('[WORKER_LOG] Script loading...');
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as Bull from 'bull';
import type { Job } from 'bull';
import { createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { DataSource } from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { Profile } from '@/modules/profiles/entities/profile.entity';
import { Chapter } from '@/modules/catalog/entities/chapter.entity';
import { Tag } from '@/modules/catalog/entities/tag.entity';
import { Plan } from '@/modules/subscriptions/entities/plan.entity';
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity';
import { Favorite } from '@/modules/catalog/entities/favorite.entity';
import { PlayEvent } from '@/modules/playback/entities/play-event.entity';
import { Download } from '@/modules/playback/entities/download.entity';
import { WorkTag } from '@/modules/catalog/entities/work-tag.entity';
import * as crypto from 'crypto';
import { Track } from '@/modules/catalog/entities/track.entity';
import { Work } from '@/modules/catalog/entities/work.entity';

const config = new ConfigService();
const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  region: process.env.S3_REGION,
  signatureVersion: 'v4',
  s3ForcePathStyle: true,
});
const bucket = process.env.S3_BUCKET as string;

async function downloadToTemp(storageKey: string): Promise<string> {
  const tmpFile = join('/app/uploads', `input-${Date.now()}.mp3`);
  const stream = s3.getObject({ Bucket: bucket, Key: storageKey }).createReadStream();
  const writeStream = createWriteStream(tmpFile);
  await new Promise<void>((resolve, reject) => {
    stream.pipe(writeStream);
    writeStream.on('finish', () => resolve());
    writeStream.on('error', reject);
  });
  return tmpFile;
}

async function transcodeMultiHls(inputPath: string, outDir: string, keyPath: string): Promise<{ masterPath: string; variants: string[] }> {
  await fs.mkdir(outDir, { recursive: true });
  const bitrates = ['64k', '96k', '128k', '192k', '256k'];
  const variants: string[] = [];
  for (const br of bitrates) {
    const variantDir = join(outDir, br);
    await fs.mkdir(variantDir, { recursive: true });
    const playlistPath = join(variantDir, 'index.m3u8');
    const segmentPattern = join(variantDir, 'segment_%04d.ts');
    const args = [
      '-i', inputPath,
      '-codec:a', 'aac',
      '-b:a', br,
      '-hls_time', '3',
      '-hls_playlist_type', 'vod',
      '-hls_key_info_file', keyPath,
      '-hls_segment_filename', segmentPattern,
      playlistPath,
    ];
    await new Promise((resolve, reject) => {
      const ff = spawn('ffmpeg', args);
      ff.on('close', (code) => (code === 0 ? resolve(null) : reject(new Error('ffmpeg failed'))));
    });
    variants.push(br);
  }
  const masterPath = join(outDir, 'master.m3u8');
  const lines: string[] = ['#EXTM3U', '#EXT-X-VERSION:3', '#EXT-X-INDEPENDENT-SEGMENTS'];
  for (const br of variants) {
    const bw = parseInt(br) * 1000; // approx bandwidth
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bw},CODECS="mp4a.40.2"`);
    lines.push(`${br}/index.m3u8`);
  }
  await fs.writeFile(masterPath, lines.join('\n'));
  return { masterPath, variants };
}

async function uploadDirToS3(prefix: string, dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true } as any);
  for (const e of entries as any[]) {
    const full = join(dir, e.name);
    const key = `${prefix}/${e.name}`;
    if (typeof (e as any).isDirectory === 'function' && e.isDirectory()) {
      await uploadDirToS3(key, full);
      continue;
    }
    const body = await fs.readFile(full);
    let contentType = 'application/octet-stream';
    let cacheControl = undefined as string | undefined;
    if (e.name.endsWith('.m3u8')) {
      contentType = 'application/vnd.apple.mpegurl';
      cacheControl = 'public,max-age=300';
    } else if (e.name.endsWith('.ts')) {
      contentType = 'video/mp2t';
      cacheControl = 'public,max-age=2592000,immutable';
    }
    await s3.upload({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }).promise();
  }
}

async function getDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ];
    const ff = spawn('ffprobe', args);
    let output = '';
    ff.stdout.on('data', (data) => { output += data.toString(); });
    ff.on('close', (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        resolve(isNaN(duration) ? 0 : duration);
      } else {
        console.warn('[WORKER_LOG] ffprobe failed to get duration');
        resolve(0); // Fallback to 0 if fails
      }
    });
    ff.on('error', (err) => {
      console.warn('[WORKER_LOG] ffprobe error:', err);
      resolve(0);
    });
  });
}

async function getDurationFromHls(outDir: string, variants: string[]): Promise<number> {
  // Fallback: sum EXTINF durations from the first variant playlist
  const variant = variants[0];
  if (!variant) return 0;
  const playlistPath = join(outDir, variant, 'index.m3u8');
  try {
    const content = await fs.readFile(playlistPath, 'utf-8');
    const matches: string[] = content.match(/#EXTINF:([0-9.]+)/g) ?? [];
    const total = matches.reduce((acc: number, line: string) => {
      const m = line.match(/#EXTINF:([0-9.]+)/);
      if (!m) return acc;
      const v = parseFloat(m[1]);
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
    return total;
  } catch (err) {
    console.warn('[WORKER_LOG] Failed to read HLS playlist for duration:', err);
    return 0;
  }
}

async function processJob(job: Job) {
  try {
    const { storageKey } = job.data;
    const dsInit = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        User,
        Profile,
        Work,
        Track,
        Chapter,
        Tag,
        Plan,
        Subscription,
        Favorite,
        PlayEvent,
        Download,
        WorkTag,
      ],
      migrations: [],
      subscribers: [],
      synchronize: false,
      logging: false,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    await dsInit.initialize();
    const trackPreRepo = dsInit.getRepository(Track);
    const trackPre = await trackPreRepo.findOne({ where: { storageKey } });
    const trackId = trackPre ? trackPre.id : undefined;
    const inputPath = await downloadToTemp(storageKey);

    // Calculate duration
    let duration = await getDuration(inputPath);
    console.log(`[WORKER_LOG] Calculated duration for ${storageKey}: ${duration}s (ffprobe)`);

    const key = crypto.randomBytes(16);
    const keyPrefix = `hls/${Date.now()}`;
    const keyLocalPath = join('/app/uploads', `enc-${Date.now()}.key`);
    const keyInfoPath = join('/app/uploads', `keyinfo-${Date.now()}.txt`);
    const keyObjectKey = `${keyPrefix}/enc.key`;
    const cdnBase = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
    const s3Base = `${(process.env.S3_ENDPOINT || '').replace(/\/$/, '')}/${process.env.S3_BUCKET}`;
    const keyUri = cdnBase ? `${cdnBase}/${keyObjectKey}` : `${s3Base}/${keyObjectKey}`;
    const ivHex = crypto.randomBytes(16).toString('hex');
    await fs.writeFile(keyLocalPath, key);
    await s3.upload({ Bucket: bucket, Key: keyObjectKey, Body: key, ContentType: 'application/octet-stream' }).promise();
    await fs.writeFile(keyInfoPath, `${keyUri}\n${keyLocalPath}\n${ivHex}`);
    const outDir = join('/app/uploads', `hls-${Date.now()}`);
    const { masterPath, variants } = await transcodeMultiHls(inputPath, outDir, keyInfoPath);

    // Fallback duration calculation if ffprobe failed
    if (!duration || duration <= 0) {
      const hlsDuration = await getDurationFromHls(outDir, variants);
      duration = hlsDuration ? hlsDuration : 0;
      console.log(`[WORKER_LOG] Duration fallback (HLS) for ${storageKey}: ${duration}s`);
    }

    await uploadDirToS3(keyPrefix, outDir);
    const manifestStorageKey = `${keyPrefix}/master.m3u8`;

    const trackRepo = dsInit.getRepository(Track);
    const track = await trackRepo.findOne({ where: { storageKey } });
    if (track) {
      track.hlsManifestStorageKey = manifestStorageKey;
      track.hlsMasterKey = manifestStorageKey;
      track.hlsBasePath = keyPrefix;
      track.hlsEncrypted = true;
      track.hlsEncryptionKey = key.toString('hex');
      track.bitrateVariants = variants;
      track.encryptionKeyId = track.id;
      track.durationSeconds = Math.round(duration); // Save duration
      await trackRepo.save(track);
    }
    await fs.unlink(inputPath);
    await fs.unlink(keyInfoPath);
    await fs.unlink(keyLocalPath);
    await dsInit.destroy();
  } catch (err) {
    console.error('transcode worker failed:', err);
    throw err;
  }
}

console.log('[WORKER_LOG] Connecting to Redis...');
const redisConfig = { host: process.env.REDIS_HOST || 'redis', port: parseInt(process.env.REDIS_PORT || '6379') };
console.log('[WORKER_LOG] Redis config:', redisConfig);
const queue = new (Bull as any)('transcode', { redis: redisConfig });
console.log('[WORKER_LOG] Connected to Redis and queue created.');
queue.process('audio', async (job: Job) => {
  console.log('[WORKER_LOG] Job received by processor:', { jobId: job.id, storageKey: job.data.storageKey });
  await processJob(job);
});
