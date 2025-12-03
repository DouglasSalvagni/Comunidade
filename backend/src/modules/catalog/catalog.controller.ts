import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { SearchWorksDto } from './dto/search-works.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Catalog')
@Controller('works')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Search and list works' })
  @ApiResponse({ status: 200, description: 'Works retrieved successfully.' })
  @ApiQuery({ name: 'type', required: false, enum: ['music', 'audiobook', 'series'] })
  @ApiQuery({ name: 'age', required: false, enum: ['0-2', '3-5', '6-8', '9-12', '13+'] })
  @ApiQuery({ name: 'tags', required: false, description: 'Comma-separated tag names' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async findAll(@Request() req, @Query() searchDto: SearchWorksDto, @Query('profileId') profileId?: string) {
    return this.catalogService.findAll(searchDto, req.user?.userId, profileId);
  }

  @Get('landing-samples')
  @ApiOperation({ summary: 'Public landing samples (up to 3 works from auxiliary table)' })
  @ApiResponse({ status: 200, description: 'Landing samples retrieved successfully.' })
  async getLandingSamples(@Query('limit') limit = 3) {
    const works = await this.catalogService.getLandingSamplesFromTable(Math.min(3, Number(limit) || 3));
    
    const items = (works || [])
      .map((w) => {
        const t = (w.tracks || [])
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
          .find((tt) => !!(tt.hlsMasterKey || tt.hlsManifestStorageKey));
        const master = t?.hlsMasterKey || t?.hlsManifestStorageKey || '';
        if (!master) return null;
        const cdnBase = (process.env.CDN_BASE_URL || '').replace(/\/$/, '');
        const s3Base = `${(process.env.S3_ENDPOINT || '').replace(/\/$/, '')}/${process.env.S3_BUCKET}`;
        const url = cdnBase ? `${cdnBase}/${master}` : `${s3Base}/${master}`;
        return { id: w.id, title: w.title, coverUrl: w.coverUrl, trackId: t?.id || null, hlsUrl: url };
      })
      .filter((x) => !!x)
      .slice(0, 3);
    return { data: items };
  }

  @Get('suggested')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get suggested works by profile age' })
  @ApiResponse({ status: 200, description: 'Suggested works retrieved successfully.' })
  async getSuggested(@Request() req, @Query('profileId') profileId?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.catalogService.findSuggested(req.user?.userId, profileId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user favorites' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getFavorites(@Request() req, @Query('page') page = 1, @Query('limit') limit = 20, @Query('profileId') profileId?: string) {
    return this.catalogService.getFavorites(req.user.userId, page, limit, profileId);
  }

  @Get('top-played')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top played works globally' })
  @ApiResponse({ status: 200, description: 'Top played works retrieved successfully.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getTopPlayed(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.catalogService.getTopPlayed(Number(page) || 1, Number(limit) || 20);
  }

  @Get('my-top-played')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my top played works' })
  @ApiResponse({ status: 200, description: 'User top played works retrieved successfully.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getMyTopPlayed(@Request() req, @Query('page') page = 1, @Query('limit') limit = 20, @Query('profileId') profileId?: string) {
    return this.catalogService.getMyTopPlayed(req.user.userId, Number(page) || 1, Number(limit) || 20, profileId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get work details' })
  @ApiResponse({ status: 200, description: 'Work retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Work not found.' })
  async findOne(@Request() req, @Param('id') id: string, @Query('profileId') profileId?: string) {
    return this.catalogService.findOne(id, req.user?.userId, profileId);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle work favorite status' })
  @ApiResponse({ status: 200, description: 'Favorite status toggled successfully.' })
  @ApiResponse({ status: 404, description: 'Work not found.' })
  async toggleFavorite(@Request() req, @Param('id') workId: string, @Query('profileId') profileId?: string) {
    return this.catalogService.toggleFavorite(workId, req.user.userId, profileId);
  }
}

// Rotas administrativas
@ApiTags('Admin - Catalog')
@Controller('admin/works')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCatalogController {
  constructor(private readonly catalogService: CatalogService) { }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all works (Admin)' })
  @ApiResponse({ status: 200, description: 'Works retrieved successfully.' })
  async findAllAdmin(@Query() searchDto: SearchWorksDto) {
    return this.catalogService.findAllAdmin(searchDto);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new work (Admin)' })
  @ApiResponse({ status: 201, description: 'Work created successfully.' })
  async create(@Body() createWorkDto: any) {
    return this.catalogService.create(createWorkDto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get work details (Admin)' })
  @ApiResponse({ status: 200, description: 'Work retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Work not found.' })
  async findOneAdmin(@Param('id') id: string) {
    const work = await this.catalogService.findOne(id);
    const isLandingSample = await this.catalogService.isLandingSample(id);
    return { ...work, isLandingSample };
  }

  @Post(':id/landing-sample')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add work to landing samples (Admin)' })
  async addLandingSample(@Param('id') id: string) {
    return this.catalogService.addLandingSample(id);
  }

  @Delete(':id/landing-sample')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove work from landing samples (Admin)' })
  async removeLandingSample(@Param('id') id: string) {
    return this.catalogService.removeLandingSample(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update work (Admin)' })
  @ApiResponse({ status: 200, description: 'Work updated successfully.' })
  @ApiResponse({ status: 404, description: 'Work not found.' })
  async update(@Param('id') id: string, @Body() updateWorkDto: any) {
    return this.catalogService.update(id, updateWorkDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete work (Admin)' })
  @ApiResponse({ status: 204, description: 'Work deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Work not found.' })
  async remove(@Param('id') id: string) {
    await this.catalogService.deleteWork(id);
    return;
  }

  @Patch(':id/toggle-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle work status (Admin)' })
  @ApiResponse({ status: 200, description: 'Work status toggled successfully.' })
  @ApiResponse({ status: 404, description: 'Work not found.' })
  async toggleStatus(@Param('id') id: string) {
    return this.catalogService.toggleStatus(id);
  }

  @Post(':id/tracks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create track for work (Admin)' })
  @ApiResponse({ status: 201, description: 'Track created successfully.' })
  async createTrack(@Param('id') id: string, @Body() body: { title: string; storageKey: string; durationSeconds?: number; orderIndex?: number }) {
    return this.catalogService.createTrack(id, body);
  }
}

// Rotas de tags administrativas
@ApiTags('Admin - Tags')
@Controller('admin/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminTagsController {
  constructor(private readonly catalogService: CatalogService) { }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all tags (Admin)' })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully.' })
  async findAll() {
    return this.catalogService.getAllTags();
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new tag (Admin)' })
  @ApiResponse({ status: 201, description: 'Tag created successfully.' })
  async create(@Body() createTagDto: { name: string; color: string }) {
    return this.catalogService.createTag(createTagDto.name, createTagDto.color);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tag (Admin)' })
  @ApiResponse({ status: 200, description: 'Tag updated successfully.' })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  async update(@Param('id') id: string, @Body() updateTagDto: { name: string; color: string }) {
    return this.catalogService.updateTag(id, updateTagDto.name, updateTagDto.color);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete tag (Admin)' })
  @ApiResponse({ status: 204, description: 'Tag deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  async remove(@Param('id') id: string) {
    return this.catalogService.deleteTag(id);
  }
}

@ApiTags('Admin - Dev Themes')
@Controller('admin/dev-themes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminDevThemesController {
  constructor(private readonly catalogService: CatalogService) { }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all development themes (Admin)' })
  @ApiResponse({ status: 200, description: 'Themes retrieved successfully.' })
  async findAll() {
    return this.catalogService.getAllDevThemes();
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new development theme (Admin)' })
  @ApiResponse({ status: 201, description: 'Theme created successfully.' })
  async create(@Body() body: { name: string; description?: string }) {
    return this.catalogService.createDevTheme(body.name, body.description);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update development theme (Admin)' })
  @ApiResponse({ status: 200, description: 'Theme updated successfully.' })
  @ApiResponse({ status: 404, description: 'Theme not found.' })
  async update(@Param('id') id: string, @Body() body: { name: string; description?: string }) {
    return this.catalogService.updateDevTheme(id, body.name, body.description);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete development theme (Admin)' })
  @ApiResponse({ status: 204, description: 'Theme deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Theme not found.' })
  async remove(@Param('id') id: string) {
    return this.catalogService.deleteDevTheme(id);
  }
}
