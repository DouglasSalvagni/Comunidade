import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CommunityService } from './community.service';
import { GenerateCommunityPostUploadUrlDto } from './dto/generate-community-post-upload-url.dto';
import { AddCommunityPostAttachmentDto } from './dto/add-community-post-attachment.dto';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';
import { UpdateCommunityPostDto } from './dto/update-community-post.dto';
import { UpdateCommunityCommentDto } from './dto/update-community-comment.dto';

@ApiTags('Community Posts')
@Controller('community/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user', 'admin')
export class CommunityPostsController {
  constructor(private readonly communityService: CommunityService) {}

  @Get(':postId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhar post da comunidade' })
  async getPost(@Param('postId') postId: string, @Request() req: any) {
    return this.communityService.getPostForUser(postId, req.user.userId, req.user.role);
  }

  @Post(':postId/attachments/upload-url')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar URL de upload para anexo do post' })
  async generateUploadUrl(
    @Param('postId') postId: string,
    @Body() dto: GenerateCommunityPostUploadUrlDto,
    @Request() req: any,
  ) {
    return this.communityService.generatePostAttachmentUploadUrl(
      postId,
      req.user.userId,
      req.user.role,
      dto.fileName,
      dto.contentType,
    );
  }

  @Post(':postId/attachments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Persistir metadados de anexo do post' })
  async addAttachment(
    @Param('postId') postId: string,
    @Body() dto: AddCommunityPostAttachmentDto,
    @Request() req: any,
  ) {
    return this.communityService.addPostAttachment(postId, req.user.userId, req.user.role, dto);
  }

  @Post(':postId/likes/toggle')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alternar curtida no post' })
  async toggleLike(@Param('postId') postId: string, @Request() req: any) {
    return this.communityService.togglePostLike(postId, req.user.userId, req.user.role);
  }

  @Patch(':postId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar post da comunidade' })
  async updatePost(
    @Param('postId') postId: string,
    @Body() dto: UpdateCommunityPostDto,
    @Request() req: any,
  ) {
    return this.communityService.updatePost(postId, req.user.userId, req.user.role, dto);
  }

  @Get(':postId/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar comentários do post com paginação por cursor' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  async listComments(
    @Param('postId') postId: string,
    @Query('limit') limit = 20,
    @Query('cursor') cursor: string | undefined,
    @Request() req: any,
  ) {
    return this.communityService.listCommentsByPost(
      postId,
      req.user.userId,
      req.user.role,
      Number(limit) || 20,
      cursor,
    );
  }

  @Post(':postId/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar comentário ou resposta no post' })
  async createComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommunityCommentDto,
    @Request() req: any,
  ) {
    return this.communityService.createCommentOnPost(postId, req.user.userId, req.user.role, dto);
  }

  @Patch(':postId/comments/:commentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar comentário ou resposta no post' })
  async updateComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommunityCommentDto,
    @Request() req: any,
  ) {
    return this.communityService.updateCommentOnPost(postId, commentId, req.user.userId, req.user.role, dto);
  }
}
