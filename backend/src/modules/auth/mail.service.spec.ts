import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  it('cria transporter quando SMTP está configurado', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'secret';
    const svc = new MailService(new ConfigService());
    // @ts-ignore
    expect(svc['transporter']).toBeTruthy();
  });

  it('usa SMTP_USER como remetente e envelope.from', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASS = 'secret';
    const svc = new MailService(new ConfigService());
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'id1' });
    // @ts-ignore
    svc['transporter'] = { sendMail } as any;
    await svc.sendPasswordReset('to@dest.com', 'tok');
    expect(sendMail).toHaveBeenCalled();
    const arg = sendMail.mock.calls[0][0];
    expect(arg.from).toBe('user@example.com');
    expect(arg.envelope.from).toBe('user@example.com');
  });
});