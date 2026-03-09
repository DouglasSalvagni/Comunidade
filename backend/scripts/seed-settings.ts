/**
 * Script de seed para popular a tabela system_settings com as chaves iniciais do white label.
 * Execução: npx ts-node scripts/seed-settings.ts
 *
 * As chaves já existentes NÃO são sobrescritas (upsert apenas se vazio).
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const INITIAL_SETTINGS: Array<{ key: string; value: string }> = [
  { key: 'platform_name', value: process.env.APP_NAME || 'Comunidade' },
  { key: 'platform_description', value: 'Plataforma de conteúdo digital' },
  { key: 'logo_url', value: process.env.APP_LOGO_URL || '' },
  { key: 'logo_compact_url', value: '' },
  { key: 'primary_color', value: process.env.APP_PRIMARY_COLOR || '#4A90E2' },
  { key: 'secondary_color', value: '#F59E0B' },
  { key: 'accent_color', value: '#FDE047' },
  { key: 'email_primary_color', value: process.env.APP_PRIMARY_COLOR || '#4A90E2' },
  { key: 'support_email', value: '' },
  { key: 'instagram_url', value: '' },
  { key: 'app_store_url', value: '' },
  { key: 'play_store_url', value: '' },
  { key: 'currency_symbol', value: 'R$' },
  { key: 'currency_code', value: 'BRL' },
  { key: 'locale', value: 'pt-BR' },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [path.resolve(__dirname, '../src/**/*.entity{.ts,.js}')],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('✅ Conectado ao banco de dados');

  const repo = dataSource.getRepository('system_settings');

  let inserted = 0;
  let skipped = 0;

  for (const setting of INITIAL_SETTINGS) {
    const existing = await repo.findOne({ where: { key: setting.key } });
    if (!existing) {
      await repo.save(repo.create({ key: setting.key, value: setting.value }));
      console.log(`  ✅ Inserido: ${setting.key} = "${setting.value}"`);
      inserted++;
    } else {
      console.log(`  ⏭️  Ignorado (já existe): ${setting.key}`);
      skipped++;
    }
  }

  console.log(`\n📊 Resultado: ${inserted} inseridos, ${skipped} ignorados`);
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
