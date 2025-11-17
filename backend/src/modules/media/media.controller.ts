import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SubscriptionsService } from '@/modules/subscriptions/subscriptions.service';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService, private readonly subscriptionsService: SubscriptionsService) {}

  @Post('upload-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get presigned upload URL (Admin only)' })
  @ApiResponse({ status: 200, description: 'Upload URL generated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid file parameters.' })
  async getUploadUrl(
    @Body() uploadData: {
      fileName: string;
      fileType: string;
      fileSize: number;
    },
  ) {
    const result = await this.mediaService.getUploadUrl(
      uploadData.fileName,
      uploadData.fileType,
      uploadData.fileSize,
    );

    return {
      uploadUrl: result.uploadUrl,
      storageKey: result.storageKey,
      expiresAt: result.expiresAt,
    };
  }

  @Post('process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process uploaded media file (Admin only)' })
  @ApiResponse({ status: 200, description: 'Media processed successfully.' })
  @ApiResponse({ status: 400, description: 'Processing failed.' })
  async processMedia(
    @Body() processData: {
      storageKey: string;
      type: 'audio' | 'image' | 'video';
      workId?: string;
    },
  ) {
    const result = await this.mediaService.processMedia(
      processData.storageKey,
      processData.type,
      processData.workId,
    );

    return {
      processedUrl: result.processedUrl,
      metadata: result.metadata,
    };
  }

  @Post('hls-key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get HLS AES-128 key for a track' })
  @ApiResponse({ status: 200, description: 'Key returned.' })
  async getHlsKey(@Request() req, @Body() body: { trackId: string }) {
    const hasAccess = await this.subscriptionsService.checkSubscriptionAccess(req.user.userId);
    if (!hasAccess) {
      return { error: 'Subscription required' };
    }
    const key = await this.mediaService.getHlsKey(body.trackId);
    return { key };
  }

  @Get('hls-key')
  @ApiOperation({ summary: 'Get HLS AES-128 key (raw) by trackId' })
  @ApiResponse({ status: 200, description: 'Key bytes returned.' })
  async getHlsKeyRaw(@Query('id') id: string, @Res() res) {
    const buf = await this.mediaService.getHlsKeyRaw(id);
    if (!buf) {
      return res.status(HttpStatus.NOT_FOUND).send('Key not found');
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    return res.status(HttpStatus.OK).send(buf);
  }
}
