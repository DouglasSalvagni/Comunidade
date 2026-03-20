import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CommunityService } from './community.service';

@ApiTags('Admin - Community Posts')
@Controller('admin/community/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCommunityPostsController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('pending')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar posts que precisam de atenção do admin' })
  async listPendingPosts() {
    return this.communityService.adminListPendingPosts();
  }

  @Post(':postId/resolve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar post como resolvido (não precisa de atenção)' })
  async resolvePost(@Param('postId') postId: string) {
    await this.communityService.adminResolvePost(postId);
    return { success: true };
  }

  @Post(':postId/pin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fixar post da comunidade' })
  async pinPost(@Param('postId') postId: string) {
    return this.communityService.adminPinPost(postId);
  }

  @Post(':postId/unpin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desfixar post da comunidade' })
  async unpinPost(@Param('postId') postId: string) {
    return this.communityService.adminUnpinPost(postId);
  }
}
