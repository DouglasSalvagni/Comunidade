import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SystemSettingsService } from './services/system-settings.service';

/** Chaves que podem ser expostas publicamente (sem autenticação) */
const PUBLIC_KEYS = [
  'platform_name',
  'platform_description',
  'logo_url',
  'logo_compact_url',
  'primary_color',
  'secondary_color',
  'accent_color',
  'sidebar_background_color',
  'support_email',
  'instagram_url',
  'app_store_url',
  'play_store_url',
  'currency_symbol',
  'currency_code',
  'locale',
  'email_primary_color',
];

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  /**
   * Retorna as configurações públicas da plataforma (sem autenticação).
   * Usado pelo frontend para ThemeProvider, BrandLogo, SEO, etc.
   */
  @Get('public')
  @ApiOperation({ summary: 'Configurações públicas da plataforma' })
  async getPublic(): Promise<Record<string, string | null>> {
    const all = await this.settingsService.list();
    const result: Record<string, string | null> = {};
    for (const setting of all) {
      if (PUBLIC_KEYS.includes(setting.key)) {
        result[setting.key] = setting.value;
      }
    }
    return result;
  }
}
