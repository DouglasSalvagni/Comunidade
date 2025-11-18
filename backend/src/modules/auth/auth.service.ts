import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

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
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
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

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
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

    return {
      user: this.sanitizeUser(user),
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
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
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: { name?: string }) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const updated = await this.usersService.update(userId, { name: data?.name ?? user.name });
    return this.sanitizeUser(updated);
  }

  async loginWithGoogle(idToken: string) {
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!resp.ok) {
      throw new UnauthorizedException('Invalid Google token');
    }
    const info: any = await resp.json();
    if (!(info && info.email && (info.email_verified === true || info.email_verified === 'true'))) {
      throw new UnauthorizedException('Unverified Google account');
    }
    const aud = info.aud;
    const expectedAud = process.env.GOOGLE_CLIENT_ID;
    if (expectedAud && aud !== expectedAud) {
      throw new UnauthorizedException('Invalid token audience');
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
}
