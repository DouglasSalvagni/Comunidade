import { Controller, Param, Post, UseGuards } from '@nestjs/common';
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
