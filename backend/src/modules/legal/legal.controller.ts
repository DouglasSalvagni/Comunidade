import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LegalService } from './legal.service';
import { CreateLegalDocumentDto } from './dto/create-legal-document.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';

@ApiTags('Legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('active')
  @ApiOperation({ summary: 'Obter documentos legais ativos' })
  @ApiResponse({ status: 200, description: 'Documentos ativos obtidos com sucesso.' })
  async getActive() {
    return this.legalService.getActiveDocuments();
  }

  @Post('accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar aceite dos documentos legais ativos para o usuário atual' })
  @ApiResponse({ status: 200, description: 'Aceite registrado com sucesso.' })
  async accept(@Request() req) {
    await this.legalService.recordUserAcceptance(req.user.userId);
    return { ok: true };
  }
}

@ApiTags('Admin - Legal')
@Controller('admin/legal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminLegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('documents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar documentos legais (Admin)' })
  @ApiResponse({ status: 200, description: 'Documentos listados com sucesso.' })
  async list(@Query('type') type?: 'PRIVACY_POLICY' | 'TERMS_OF_USE') {
    return this.legalService.listDocuments(type);
  }

  @Post('documents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar documento legal (Admin)' })
  @ApiResponse({ status: 201, description: 'Documento criado com sucesso.' })
  async create(@Body() dto: CreateLegalDocumentDto) {
    return this.legalService.createDocument({ type: dto.type, content: dto.content, isActive: dto.isActive });
  }

  @Patch('documents/:id/activate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ativar documento legal (Admin)' })
  @ApiResponse({ status: 200, description: 'Documento ativado com sucesso.' })
  async activate(@Param('id') id: string) {
    return this.legalService.activateDocument(id);
  }
}
