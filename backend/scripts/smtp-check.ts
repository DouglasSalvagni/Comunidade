import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

async function main() {
  const config = new ConfigService();
  const host = config.get<string>('SMTP_HOST');
  const port = parseInt(config.get<string>('SMTP_PORT') || '587');
  const user = config.get<string>('SMTP_USER');
  const pass = config.get<string>('SMTP_PASS');
  if (!host || !user || !pass) {
    console.log('SMTP não configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
    process.exit(1);
  }
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  try {
    const ok = await transporter.verify();
    console.log('Conexão SMTP válida:', ok === true);
  } catch (e: any) {
    console.error('Falha ao verificar SMTP:', e?.message || e);
    process.exit(1);
  }
}

main();