import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PlaylistsService } from './playlists.service';

@ApiTags('Playlists')
@Controller('playlists')
@UseGuards(JwtAuthGuard)
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List playlists by profile or user' })
  @ApiResponse({ status: 200, description: 'Playlists retrieved successfully.' })
  @ApiQuery({ name: 'profileId', required: false })
  async list(@Request() req, @Query('profileId') profileId?: string) {
    return this.playlistsService.list(req.user.userId, profileId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create playlist' })
  @ApiResponse({ status: 201, description: 'Playlist created successfully.' })
  async create(
    @Request() req,
    @Body() body: { name: string; profileId?: string },
  ) {
    return this.playlistsService.create(body.name, req.user.userId, body.profileId);
  }

  @Post(':playlistId/items')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to playlist' })
  @ApiResponse({ status: 201, description: 'Item added successfully.' })
  async addItem(@Param('playlistId') playlistId: string, @Body() body: { trackId: string }) {
    return this.playlistsService.addItem(playlistId, body.trackId);
  }

  @Delete(':playlistId/items/:itemId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from playlist' })
  @ApiResponse({ status: 204, description: 'Item removed successfully.' })
  async removeItem(@Param('playlistId') playlistId: string, @Param('itemId') itemId: string) {
    await this.playlistsService.removeItem(playlistId, itemId);
    return { status: 'ok' };
  }

  @Patch(':playlistId/items/reorder')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder items in playlist' })
  @ApiResponse({ status: 200, description: 'Items reordered successfully.' })
  async reorder(@Param('playlistId') playlistId: string, @Body() body: { itemIdsInOrder: string[] }) {
    await this.playlistsService.reorderItems(playlistId, body.itemIdsInOrder);
    return { status: 'ok' };
  }

  @Get(':playlistId/items')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List items in playlist' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully.' })
  async getItems(@Param('playlistId') playlistId: string) {
    return this.playlistsService.getItems(playlistId);
  }
}
