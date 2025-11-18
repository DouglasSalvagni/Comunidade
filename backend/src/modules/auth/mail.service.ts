import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = parseInt(this.config.get<string>('SMTP_PORT') || '587');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
  }

  async sendPasswordReset(email: string, token: string) {
    const origin = this.config.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
    const resetLink = `${origin}/auth/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const from = process.env.SMTP_USER || process.env.SMTP_FROM || 'no-reply@little-tales.com';
    const subject = 'Recuperação de senha - Little Tales';
    const text = `Você solicitou a recuperação de senha. Use o link: ${resetLink}\nSe você não solicitou, ignore este e-mail.`;
    const html = `<p>Você solicitou a recuperação de senha.</p><p><a href="${resetLink}">Clique aqui para criar uma nova senha</a></p><p>Se você não solicitou, ignore este e-mail.</p>`;

    if (!this.transporter) {
      console.log('[MailService] SMTP não configurado. Conteúdo do e-mail:', { to: email, subject, text });
      return;
    }
    console.log('[MailService] Remetente configurado', from);
    const info = await this.transporter.sendMail({ from, to: email, subject, text, html, envelope: { from, to: email } });
    console.log('[MailService] E-mail de recuperação enviado', { to: email, messageId: (info as any)?.messageId });
  }
}