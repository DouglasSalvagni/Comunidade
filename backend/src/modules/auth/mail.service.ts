import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private isDev: boolean = false;

  constructor(private readonly config: ConfigService) {
    const nodeEnv = this.config.get<string>('NODE_ENV') || process.env.NODE_ENV || 'development';
    this.isDev = nodeEnv === 'development';
    const host = this.config.get<string>('SMTP_HOST') || process.env.SMTP_HOST;
    const port = parseInt(this.config.get<string>('SMTP_PORT') || process.env.SMTP_PORT || '587');
    const user = this.config.get<string>('SMTP_USER') || process.env.SMTP_USER;
    const pass = this.config.get<string>('SMTP_PASS') || process.env.SMTP_PASS;
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
      if (this.isDev) {
        console.log('[MailService] SMTP não configurado. Conteúdo do e-mail:', { to: email, subject, text });
      } else {
        console.log('[MailService] SMTP não configurado. E-mail de recuperação não enviado.');
      }
      return;
    }
    console.log('[MailService] Remetente configurado', from);
    const info = await this.transporter.sendMail({ from, to: email, subject, text, html, envelope: { from, to: email } });
    console.log('[MailService] E-mail de recuperação enviado', { to: email, messageId: (info as any)?.messageId });
  }

  async sendEmailVerification(email: string, token: string) {
    const origin = this.config.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
    const verifyLink = `${origin}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const from = process.env.SMTP_USER || process.env.SMTP_FROM || 'no-reply@little-tales.com';
    const subject = 'Confirme seu e-mail - Little Tales';
    const text = `Bem-vindo! Confirme seu e-mail acessando: ${verifyLink}`;
    const html = `<p>Bem-vindo!</p><p><a href="${verifyLink}">Clique aqui para confirmar seu e-mail</a></p>`;

    if (!this.transporter) {
      if (this.isDev) {
        console.log('[MailService] SMTP não configurado. Conteúdo do e-mail de verificação:', { to: email, subject, text });
      } else {
        console.log('[MailService] SMTP não configurado. E-mail de verificação não enviado.');
      }
      return;
    }
    const info = await this.transporter.sendMail({ from, to: email, subject, text, html, envelope: { from, to: email } });
    console.log('[MailService] E-mail de verificação enviado', { to: email, messageId: (info as any)?.messageId });
  }
}