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
export class AdminSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar configurações' })
  async list() {
    return this.systemSettingsService.list();
  }

  @Get(':key')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar configuração' })
  async get(@Param('key') key: string) {
    const value = await this.systemSettingsService.getValue(key);
    return { key, value };
  }

  @Put(':key')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar configuração' })
  async set(
    @Param('key') key: string,
    @Body() body: { value: string | null },
  ) {
    const value = body?.value ?? null;
    return this.systemSettingsService.setValue(key, value);
  }
}
