import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlaybackService } from './playback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Playback')
@Controller('playback')
@UseGuards(JwtAuthGuard)
export class PlaybackController {
  constructor(private readonly playbackService: PlaybackService) {}

  @Get(':trackId/url')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get streaming URL for a track' })
  @ApiResponse({ status: 200, description: 'Streaming URL retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Subscription required.' })
  @ApiResponse({ status: 404, description: 'Track not found.' })
  async getStreamingUrl(@Request() req, @Param('trackId') trackId: string) {
    return this.playbackService.getStreamingUrl(trackId, req.user.userId);
  }

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a playback event' })
  @ApiResponse({ status: 201, description: 'Event recorded successfully.' })
  @ApiResponse({ status: 403, description: 'Subscription required.' })
  async recordPlayEvent(
    @Request() req,
    @Body() eventData: {
      trackId: string;
      eventType: 'play' | 'pause' | 'complete' | 'seek';
      positionSeconds: number;
      profileId?: string;
    },
  ) {
    return this.playbackService.recordPlayEvent(
      eventData.trackId,
      eventData.eventType,
      eventData.positionSeconds,
      req.user.userId,
      eventData.profileId,
    );
  }

  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get playback history' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully.' })
  @ApiQuery({ name: 'profileId', required: false, description: 'Filter by profile ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  async getPlayHistory(
    @Request() req,
    @Query('profileId') profileId?: string,
    @Query('limit') limit = 50,
  ) {
    return this.playbackService.getPlayHistory(req.user.userId, profileId, limit);
  }

  @Post('downloads')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download track for offline playback' })
  @ApiResponse({ status: 201, description: 'Download initiated successfully.' })
  @ApiResponse({ status: 403, description: 'Premium subscription required.' })
  @ApiResponse({ status: 429, description: 'Download limit reached.' })
  async downloadTrack(
    @Request() req,
    @Body() downloadData: {
      trackId: string;
      profileId: string;
      deviceId: string;
    },
  ) {
    return this.playbackService.downloadTrack(
      downloadData.trackId,
      req.user.userId,
      downloadData.profileId,
      downloadData.deviceId,
    );
  }

  @Get('downloads')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active downloads for profile' })
  @ApiResponse({ status: 200, description: 'Downloads retrieved successfully.' })
  @ApiQuery({ name: 'profileId', required: true, description: 'Profile ID' })
  async getDownloads(@Query('profileId') profileId: string) {
    return this.playbackService.getDownloads(profileId);
  }

  @Delete('downloads/:downloadId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a download' })
  @ApiResponse({ status: 204, description: 'Download removed successfully.' })
  @ApiResponse({ status: 404, description: 'Download not found.' })
  async removeDownload(
    @Request() req,
    @Param('downloadId') downloadId: string,
    @Query('profileId') profileId: string,
  ) {
    return this.playbackService.removeDownload(downloadId, profileId);
  }
}