import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from './mail.service';

describe('AuthService password recovery', () => {
  const jwt = new JwtService({ secret: 'test' });

  it('forgotPassword envia e-mail para usuário local', async () => {
    const user = { id: 'u1', email: 'a@b.com', name: 'A', authProvider: 'local' } as any;
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(user),
      update: jest.fn(),
      userRepository: { save: jest.fn() },
    } as any as UsersService;
    const mailService = { sendPasswordReset: jest.fn().mockResolvedValue(undefined) } as any as MailService;
    const svc = new AuthService(usersService, jwt, mailService);
    const res = await svc.forgotPassword('a@b.com');
    expect(res).toEqual({ ok: true });
    expect(mailService.sendPasswordReset).toHaveBeenCalled();
  });

  it('forgotPassword não envia para login social', async () => {
    const user = { id: 'u2', email: 'c@d.com', name: 'C', authProvider: 'google' } as any;
    const usersService = { findByEmail: jest.fn().mockResolvedValue(user) } as any as UsersService;
    const mailService = { sendPasswordReset: jest.fn() } as any as MailService;
    const svc = new AuthService(usersService, jwt, mailService);
    const res = await svc.forgotPassword('c@d.com');
    expect(res).toEqual({ ok: true });
    expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
  });
});