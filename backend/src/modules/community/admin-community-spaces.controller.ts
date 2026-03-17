import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CommunityService } from './community.service';
import { CreateCommunitySpaceDto } from './dto/create-community-space.dto';
import { UpdateCommunitySpaceDto } from './dto/update-community-space.dto';
import { UpdateCommunitySpaceAccessDto } from './dto/update-community-space-access.dto';

@ApiTags('Admin - Community Spaces')
@Controller('admin/community/spaces')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCommunitySpacesController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar espaços da comunidade' })
  async listSpaces() {
    return this.communityService.adminListSpaces();
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar espaço da comunidade' })
  async createSpace(@Body() dto: CreateCommunitySpaceDto, @Request() req: any) {
    return this.communityService.adminCreateSpace(dto, req.user.userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalhar espaço da comunidade' })
  async getSpace(@Param('id') id: string) {
    return this.communityService.adminGetSpace(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar espaço da comunidade' })
  async updateSpace(@Param('id') id: string, @Body() dto: UpdateCommunitySpaceDto) {
    return this.communityService.adminUpdateSpace(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir espaço da comunidade' })
  async deleteSpace(@Param('id') id: string) {
    await this.communityService.adminDeleteSpace(id);
  }

  @Patch(':id/access/plans')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar acesso por planos do espaço' })
  async updatePlanAccess(@Param('id') id: string, @Body() body: UpdateCommunitySpaceAccessDto) {
    return this.communityService.adminUpdatePlanAccess(id, body.ids);
  }

  @Patch(':id/access/courses')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar acesso por cursos do espaço' })
  async updateCourseAccess(@Param('id') id: string, @Body() body: UpdateCommunitySpaceAccessDto) {
    return this.communityService.adminUpdateCourseAccess(id, body.ids);
  }
}
