import { Body, Controller, Get, Param, Put, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { SystemSettingsService } from '@/modules/settings/services/system-settings.service';
import { StorageService } from '@/modules/courses/storage.service';

@ApiTags('Admin - Settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminSettingsController {
  constructor(
    private readonly settingsService: SystemSettingsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as configurações do sistema' })
  list() {
    return this.settingsService.list();
  }

  @Post('upload-url')
  @ApiOperation({ summary: 'Gerar URL de upload para mídias do sistema (logo, favicon)' })
  async generateUploadUrl(
    @Body() body: { fileName: string; contentType: string; type: 'logo' | 'favicon' | 'logo_compact' },
  ) {
    const safeName = body.fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const key = `settings/${body.type}-${Date.now()}-${safeName}`;
    
    // We can't use generateAttachmentUploadUrl because it prefixes with 'attachments/'
    // But since generateAttachmentUploadUrl prepends 'attachments/', let's just use it and accept the prefix.
    // However, we want a persistent URL for logos.
    
    // Using existing method
    const result = await this.storageService.generateAttachmentUploadUrl(key, body.contentType);
    const actualKey = result.key; // 'attachments/settings/logo-...'

    // Se tiver CDN configurada, usa a CDN, senão, tenta gerar uma URL de leitura assinada
    // IMPORTANTE: Logos precisam ser públicos. O ideal é que o bucket ou a CDN sejam públicos.
    // Vamos usar o generateViewUrl que vai retornar a CDN (se houver) ou a URL pré-assinada.
    // Idealmente, para logos, o usuário DEVE ter CDN configurada.
    const viewUrl = await this.storageService.generateViewUrl(actualKey);
    
    // Remove query params if it's a signed URL to make it persistent (requires public bucket)
    // Se o bucket não for público, a imagem vai quebrar após a expiração, então a recomendação é usar CDN.
    const persistentViewUrl = viewUrl.split('?')[0];

    return { uploadUrl: result.uploadUrl, key: actualKey, viewUrl: persistentViewUrl };
  }

  @Put(':key')
  @ApiOperation({ summary: 'Criar ou atualizar uma configuração pelo key' })
  upsert(
    @Param('key') key: string,
    @Body() body: { value: string | null },
  ) {
    return this.settingsService.setValue(key, body.value ?? null);
  }
}
