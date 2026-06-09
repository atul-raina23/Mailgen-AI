import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Cryptographically secure password hashing (PBKDF2 SHA-512)
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  async validateUser(email: string, name: string, avatar: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          avatar,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { email },
        data: { name, avatar },
      });
    }

    return user;
  }

  async signup(email: string, password: string, name?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const hashedPassword = this.hashPassword(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
      },
    });

    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  async loginWithPassword(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isMatch = this.verifyPassword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id, name: user.name, avatar: user.avatar };
    
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const hashedRefreshToken = this.hashToken(refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async login(user: any) {
    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const hashedInput = this.hashToken(refreshToken);
    if (user.hashedRefreshToken !== hashedInput) {
      throw new UnauthorizedException('Access Denied: Invalid Refresh Token');
    }

    return this.generateTokens(user);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
    return { success: true };
  }

  async linkGoogleAccount(userId: string, accessToken: string, refreshToken: string) {
    return this.prisma.connectedAccount.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
      update: {
        accessToken,
        refreshToken,
      },
      create: {
        userId,
        provider: 'google',
        accessToken,
        refreshToken,
      },
    });
  }
}
