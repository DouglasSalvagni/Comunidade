import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { SystemSettingsService } from '@/modules/settings/services/system-settings.service';

@ApiTags('Admin - Settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as configurações do sistema' })
  list() {
    return this.settingsService.list();
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
