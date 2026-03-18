import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CommunityService } from './community.service';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';

@ApiTags('Community Spaces')
@Controller('community/spaces')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user', 'admin')
export class CommunitySpacesController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar espaços acessíveis para o usuário logado' })
  async listAccessibleSpaces(@Request() req: any) {
    return this.communityService.listSpacesForUser(req.user.userId, req.user.role);
  }

  @Get(':spaceId/feed')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar feed de posts do espaço' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listSpaceFeed(
    @Param('spaceId') spaceId: string,
    @Request() req: any,
    @Query('limit') limit = 20,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
  ) {
    return this.communityService.listFeedBySpace(
      spaceId,
      req.user.userId,
      req.user.role,
      Number(limit) || 20,
      cursor,
      search,
    );
  }

  @Post(':spaceId/posts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar post no espaço' })
  async createPostInSpace(
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateCommunityPostDto,
    @Request() req: any,
  ) {
    return this.communityService.createPostInSpace(spaceId, req.user.userId, req.user.role, dto);
  }
}
