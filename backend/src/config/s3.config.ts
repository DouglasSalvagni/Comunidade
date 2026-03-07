import { S3ClientConfig } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export default (configService: ConfigService): S3ClientConfig => ({
  endpoint: configService.get<string>('S3_ENDPOINT'),
  region: configService.get<string>('S3_REGION'),
  credentials: {
    accessKeyId: configService.get<string>('S3_ACCESS_KEY'),
    secretAccessKey: configService.get<string>('S3_SECRET_KEY'),
  },
  forcePathStyle: true,
});