import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private isDev: boolean = false;
  private appName: string;
  private primaryColor: string;
  private logoUrl: string;
  private supportUrl: string;

  constructor(
    private readonly config: ConfigService,
  ) {
    const nodeEnv = this.config.get<string>('NODE_ENV') || process.env.NODE_ENV || 'development';
    this.isDev = nodeEnv === 'development';
    this.appName = this.config.get<string>('APP_NAME') || 'Comunidade';
    this.primaryColor = this.config.get<string>('APP_PRIMARY_COLOR') || '#4A90E2';
    this.logoUrl = this.config.get<string>('APP_LOGO_URL') || '';
    this.supportUrl = this.config.get<string>('APP_SUPPORT_URL') || '';
    
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

  private getTemplate(content: string): string {
    const logoHtml = this.logoUrl
      ? `<img src="${this.logoUrl}" alt="${this.appName}" style="max-height: 48px; width: auto;" />`
      : `<h1 style="color: ${this.primaryColor}; margin-bottom: 20px;">${this.appName}</h1>`;

    const supportLink = this.supportUrl
      ? `<p><a href="${this.supportUrl}" style="color: ${this.primaryColor};">Central de Ajuda</a></p>`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; color: #333; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f7f6; padding-bottom: 40px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden; }
    .header { background-color: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 1px solid #edf2f7; }
    .content { padding: 40px 30px; line-height: 1.6; font-size: 16px; color: #525f7f; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #8898aa; }
    .button { display: inline-block; padding: 14px 28px; background-color: ${this.primaryColor}; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; text-align: center; }
    .button:hover { background-color: #357abd; }
    p { margin-bottom: 15px; }
    h2 { color: #32325d; margin-top: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding: 20px 0 30px 0;">
          <div class="container">
            <div class="header">
              ${logoHtml}
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${this.appName}. Todos os direitos reservados.</p>
              <p>Este é um e-mail automático, por favor não responda.</p>
              ${supportLink}
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
    `;
  }

  async sendPasswordReset(email: string, token: string) {
    const origin = this.config.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
    const resetLink = `${origin}/auth/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const from = process.env.SMTP_USER || process.env.SMTP_FROM || `no-reply@${origin.replace(/^https?:\/\//, '')}`;
    const subject = `Recuperação de senha - ${this.appName}`;
    const text = `Você solicitou a recuperação de senha. Use o link: ${resetLink}\nSe você não solicitou, ignore este e-mail.`;
    
    const htmlContent = `
      <h2>Recuperação de Senha</h2>
      <p>Olá,</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no ${this.appName}.</p>
      <p>Se foi você, clique no botão abaixo para criar uma nova senha:</p>
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Redefinir Minha Senha</a>
      </div>
      <p style="margin-top: 30px; font-size: 14px;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
      <p style="font-size: 14px; color: #007bff; word-break: break-all;">${resetLink}</p>
      <p>Se você não solicitou esta alteração, pode ignorar este e-mail com segurança.</p>
    `;

    if (!this.transporter) {
      if (this.isDev) {
        console.log('[MailService] SMTP não configurado. Conteúdo do e-mail:', { to: email, subject, text });
      } else {
        console.log('[MailService] SMTP não configurado. E-mail de recuperação não enviado.');
      }
      return;
    }

    const html = this.getTemplate(htmlContent);
    
    console.log('[MailService] Remetente configurado', from);
    const info = await this.transporter.sendMail({ 
      from, 
      to: email, 
      subject, 
      text, 
      html,
      envelope: { from, to: email } 
    });
    console.log('[MailService] E-mail de recuperação enviado', { to: email, messageId: (info as any)?.messageId });
  }

  async sendEmailVerification(email: string, token: string) {
    const origin = this.config.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
    const verifyLink = `${origin}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const from = process.env.SMTP_USER || process.env.SMTP_FROM || `no-reply@${origin.replace(/^https?:\/\//, '')}`;
    const subject = `Confirme seu e-mail - ${this.appName}`;
    const text = `Bem-vindo! Confirme seu e-mail acessando: ${verifyLink}`;
    
    const htmlContent = `
      <h2>Bem-vindo ao ${this.appName}!</h2>
      <p>Olá,</p>
      <p>Estamos muito felizes em ter você conosco. Para começar a aproveitar todo o nosso conteúdo, precisamos apenas que você confirme seu endereço de e-mail.</p>
      <div style="text-align: center;">
        <a href="${verifyLink}" class="button">Confirmar E-mail</a>
      </div>
      <p style="margin-top: 30px; font-size: 14px;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
      <p style="font-size: 14px; color: #007bff; word-break: break-all;">${verifyLink}</p>
    `;

    if (!this.transporter) {
      if (this.isDev) {
        console.log('[MailService] SMTP não configurado. Conteúdo do e-mail de verificação:', { to: email, subject, text });
      } else {
        console.log('[MailService] SMTP não configurado. E-mail de verificação não enviado.');
      }
      return;
    }

    const html = this.getTemplate(htmlContent);

    const info = await this.transporter.sendMail({ 
      from, 
      to: email, 
      subject, 
      text, 
      html,
      envelope: { from, to: email } 
    });
    console.log('[MailService] E-mail de verificação enviado', { to: email, messageId: (info as any)?.messageId });
  }
}
