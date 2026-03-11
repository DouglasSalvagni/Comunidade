import { Injectable, UnauthorizedException, ConflictException, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { MailService } from './mail.service';
import { LegalService } from '../legal/legal.service';

import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AppleOAuthDto } from './dto/apple-oauth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { StorageService } from '../courses/storage.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly storageService: StorageService,
    @Optional() private readonly legalService?: LegalService,
  ) { }

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

    const acceptedLegal = this.legalService ? await this.legalService.hasUserAcceptedActive(user.id) : false;
    const hasAcceptedAnyRequired = this.legalService ? await this.legalService.hasUserAcceptedRequiredEver(user.id) : false;
    return {
      user: { ...(await this.sanitizeUserWithAvatar(user)), acceptedLegal, hasAcceptedAnyRequired },
      accessToken: user.authProvider === 'local' && !user.emailVerified ? '' : this.jwtService.sign(payload),
      refreshToken: user.authProvider === 'local' && !user.emailVerified ? '' : this.generateRefreshToken(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    if (!registerDto.acceptedLegal) {
      throw new UnauthorizedException('É necessário aceitar os Termos de Uso e a Política de Privacidade.');
    }
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

    if (this.legalService) {
      await this.legalService.recordUserAcceptance(user.id);
    }
    try {
      await this.subscriptionsService.tryAutoGrantCourtesy(user.id);
    } catch { }

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

    const acceptedLegal = this.legalService ? await this.legalService.hasUserAcceptedActive(user.id) : false;
    const hasAcceptedAnyRequired = this.legalService ? await this.legalService.hasUserAcceptedRequiredEver(user.id) : false;
    return {
      user: { ...(await this.sanitizeUserWithAvatar(user)), acceptedLegal, hasAcceptedAnyRequired },
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
    const acceptedLegal = this.legalService ? await this.legalService.hasUserAcceptedActive(user.id) : false;
    const hasAcceptedAnyRequired = this.legalService ? await this.legalService.hasUserAcceptedRequiredEver(user.id) : false;
    return { ...(await this.sanitizeUserWithAvatar(user)), acceptedLegal, hasAcceptedAnyRequired };
  }

  async updateProfile(
    userId: string,
    data: { name?: string; bio?: string; profileLinks?: Array<{ label: string; url: string }> },
  ) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    const normalizedLinks = Array.isArray(data?.profileLinks)
      ? data.profileLinks
        .filter((link) => link?.label?.trim() && link?.url?.trim())
        .slice(0, 10)
        .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
      : user.profileLinks ?? [];
    const updated = await this.usersService.update(userId, {
      name: data?.name ?? user.name,
      bio: data?.bio !== undefined ? data.bio : user.bio ?? null,
      profileLinks: data?.profileLinks !== undefined ? normalizedLinks : user.profileLinks ?? [],
    } as any);
    return this.sanitizeUserWithAvatar(updated);
  }

  async generateAvatarUploadUrl(userId: string, fileName: string, contentType: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    const safeName = (fileName || 'avatar')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .slice(0, 120);
    const key = `avatars/${user.id}/${Date.now()}-${safeName || 'avatar'}`;
    return this.storageService.generateAttachmentUploadUrl(key, contentType || 'application/octet-stream');
  }

  async updateAvatar(userId: string, avatarKey: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    const updated = await this.usersService.update(userId, { avatarKey } as any);
    return this.sanitizeUserWithAvatar(updated);
  }

  async deleteAccount(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    await this.usersService.remove(userId);
    return { ok: true };
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
    let created = false;
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
      created = true;
    }
    if (created) {
      try {
        await this.subscriptionsService.tryAutoGrantCourtesy(user.id);
      } catch { }
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const acceptedLegal = this.legalService ? await this.legalService.hasUserAcceptedActive(user.id) : false;
    const hasAcceptedAnyRequired = this.legalService ? await this.legalService.hasUserAcceptedRequiredEver(user.id) : false;
    return {
      user: { ...(await this.sanitizeUserWithAvatar(user)), acceptedLegal, hasAcceptedAnyRequired },
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /* ───────── Apple Sign-In ───────── */

  private appleJwksClient = jwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys',
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 600_000, // 10 min
  });

  private getAppleSigningKey(header: jwt.JwtHeader): Promise<string> {
    return new Promise((resolve, reject) => {
      this.appleJwksClient.getSigningKey(header.kid, (err, key) => {
        if (err) return reject(err);
        resolve(key.getPublicKey());
      });
    });
  }

  private getAppleAllowedAudiences(): string[] {
    const envList = (process.env.APPLE_CLIENT_IDS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const directList = [
      process.env.APPLE_CLIENT_ID,
      process.env.APPLE_CLIENT_ID_IOS,
      process.env.APPLE_CLIENT_ID_WEB,
    ]
      .map((value) => (value || '').trim())
      .filter(Boolean);
    return Array.from(new Set([...directList, ...envList]));
  }

  private getAppleVerifyAudience(): [string, ...string[]] | undefined {
    const audiences = this.getAppleAllowedAudiences();
    return audiences.length > 0 ? [audiences[0], ...audiences.slice(1)] : undefined;
  }

  async loginWithApple(dto: AppleOAuthDto) {
    // 1. Decode header to get kid
    const decoded = jwt.decode(dto.identityToken, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Token da Apple inválido');
    }

    // 2. Get signing key and verify JWT
    let payload: any;
    try {
      const publicKey = await this.getAppleSigningKey(decoded.header);
      const expectedAudiences = this.getAppleVerifyAudience();
      payload = jwt.verify(dto.identityToken, publicKey, {
        issuer: 'https://appleid.apple.com',
        audience: expectedAudiences,
        algorithms: ['RS256'],
      });
    } catch (e: any) {
      throw new UnauthorizedException('Token da Apple inválido');
    }

    const appleSub = payload.sub as string; // Apple user identifier
    const tokenEmail = payload.email as string | undefined;

    // 3. Try to find user by appleUserId (repeat login — Apple may not send email again)
    let user = await this.usersService.findByAppleUserId(appleSub);
    if (user) {
      const jwtPayload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
      const acceptedLegal = this.legalService ? await this.legalService.hasUserAcceptedActive(user.id) : false;
      const hasAcceptedAnyRequired = this.legalService ? await this.legalService.hasUserAcceptedRequiredEver(user.id) : false;
      return {
        user: { ...(await this.sanitizeUserWithAvatar(user)), acceptedLegal, hasAcceptedAnyRequired },
        accessToken: this.jwtService.sign(jwtPayload),
        refreshToken: this.generateRefreshToken(jwtPayload),
      };
    }

    // 4. Resolve email: token > dto > fictitious
    let email = tokenEmail || dto.user?.email || undefined;
    if (!email) {
      const slug = appleSub.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
      email = `apple_${slug}_${Date.now()}@privaterelay.appleid.com`;
    }
    email = email.trim().toLowerCase();

    // 5. Check if email already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Este e-mail já está em uso com outro método de login. Use o método original para entrar.');
    }

    // 6. Resolve name
    const firstName = dto.user?.name?.firstName || '';
    const lastName = dto.user?.name?.lastName || '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || 'Usuário Apple';

    // 7. Create user
    const pseudoHash = await bcrypt.hash(String(Date.now()), 10);
    user = await this.usersService.createWithPasswordHash({
      email,
      name,
      passwordHash: pseudoHash,
      role: 'user',
      isActive: true,
      emailVerified: true,
      authProvider: 'apple',
      appleUserId: appleSub,
    });

    try {
      await this.subscriptionsService.tryAutoGrantCourtesy(user.id);
    } catch { }

    const jwtPayload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const acceptedLegal = this.legalService ? await this.legalService.hasUserAcceptedActive(user.id) : false;
    const hasAcceptedAnyRequired = this.legalService ? await this.legalService.hasUserAcceptedRequiredEver(user.id) : false;
    return {
      user: { ...(await this.sanitizeUserWithAvatar(user)), acceptedLegal, hasAcceptedAnyRequired },
      accessToken: this.jwtService.sign(jwtPayload),
      refreshToken: this.generateRefreshToken(jwtPayload),
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
    return this.sanitizeUserWithAvatar(updated);
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

  private async sanitizeUserWithAvatar(user: User) {
    const sanitized = this.sanitizeUser(user) as any;
    if (!sanitized.avatarKey) {
      sanitized.avatarUrl = null;
      return sanitized;
    }
    try {
      sanitized.avatarUrl = await this.storageService.generateViewUrl(sanitized.avatarKey);
    } catch {
      sanitized.avatarUrl = null;
    }
    return sanitized;
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
    const acceptedLegal = this.legalService ? await this.legalService.hasUserAcceptedActive(user.id) : false;
    return {
      user: { ...(await this.sanitizeUserWithAvatar(user)), acceptedLegal },
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
