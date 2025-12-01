import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from './mail.service';

import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Sua conta está desativada.');
    }

    if (user.authProvider === 'local' && !user.emailVerified) {
      throw new UnauthorizedException('Seu e-mail ainda não foi verificado.');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      user: this.sanitizeUser(user),
      accessToken: user.authProvider === 'local' && !user.emailVerified ? '' : this.jwtService.sign(payload),
      refreshToken: user.authProvider === 'local' && !user.emailVerified ? '' : this.generateRefreshToken(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Já existe usuário com este e-mail');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user with password hash and local provider
    const user = await this.usersService.createWithPasswordHash({
      name: registerDto.name,
      email: registerDto.email,
      passwordHash: hashedPassword,
      role: 'user',
      isActive: true,
      emailVerified: false,
      authProvider: 'local',
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Gerar token de verificação e enviar e-mail
    if (user.authProvider === 'local' && !user.emailVerified) {
      const token = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.emailVerificationTokenHash = hash;
      user.emailVerificationExpiresAt = expires;
      await (this as any).usersService['userRepository'].save(user);
      await this.mailService.sendEmailVerification(user.email, token);
    }

    return {
      user: this.sanitizeUser(user),
      accessToken: user.authProvider === 'local' && !user.emailVerified ? '' : this.jwtService.sign(payload),
      refreshToken: user.authProvider === 'local' && !user.emailVerified ? '' : this.generateRefreshToken(payload),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      return {
        accessToken: this.jwtService.sign(newPayload),
        refreshToken: this.generateRefreshToken(newPayload),
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: { name?: string }) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    const updated = await this.usersService.update(userId, { name: data?.name ?? user.name });
    return this.sanitizeUser(updated);
  }

  async loginWithGoogle(idToken: string) {
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!resp.ok) {
      throw new UnauthorizedException('Token do Google inválido');
    }
    const info: any = await resp.json();
    if (!(info && info.email && (info.email_verified === true || info.email_verified === 'true'))) {
      throw new UnauthorizedException('Conta Google não verificada');
    }
    const aud = info.aud;
    const expectedAud = process.env.GOOGLE_CLIENT_ID;
    if (expectedAud && aud !== expectedAud) {
      throw new UnauthorizedException('Audiência do token inválida');
    }

    let user = await this.usersService.findByEmail(info.email);
    if (!user) {
      const pseudoHash = await bcrypt.hash(String(Date.now()), 10);
      user = await this.usersService.createWithPasswordHash({
        email: info.email,
        name: info.name || info.given_name || 'Usuário Google',
        passwordHash: pseudoHash,
        role: 'user',
        isActive: true,
        emailVerified: true,
        authProvider: 'google',
      });
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      user: this.sanitizeUser(user),
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    if (user.authProvider && user.authProvider !== 'local') {
      throw new UnauthorizedException('Alteração de senha não disponível para login social');
    }
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash || '');
    if (!isValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    const updated = await this.usersService.updatePasswordHash(user.id, newHash);
    return this.sanitizeUser(updated);
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: '30d',
    });
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    // Resposta sempre OK para evitar enumeração de usuários
    if (!user || (user.authProvider && user.authProvider !== 'local')) {
      return { ok: true };
    }
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    user.passwordResetTokenHash = hash;
    user.passwordResetExpiresAt = expires;
    await this.usersService.update(user.id, { name: user.name } as any);
    // garantir persistência dos novos campos
    await (this as any).usersService['userRepository'].save(user);
    await this.mailService.sendPasswordReset(user.email, token);
    return { ok: true };
  }

  async requestEmailVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.authProvider !== 'local') {
      return { ok: true };
    }
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.emailVerificationTokenHash = hash;
    user.emailVerificationExpiresAt = expires;
    await (this as any).usersService['userRepository'].save(user);
    await this.mailService.sendEmailVerification(user.email, token);
    return { ok: true };
  }

  async verifyEmail(token: string) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const repo = (this as any).usersService['userRepository'] as any;
    const user = await repo.findOne({ where: { emailVerificationTokenHash: hash } });
    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await repo.save(user);
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return {
      user: this.sanitizeUser(user),
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    // procurar por usuário que tenha este hash ativo e não expirado
    const repo = (this as any).usersService['userRepository'] as any;
    const user = await repo.findOne({ where: { passwordResetTokenHash: hash } });
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newHash;
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await repo.save(user);
    return { ok: true };
  }
}
