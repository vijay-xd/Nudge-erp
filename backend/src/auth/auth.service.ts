import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { JwtPayload } from '../common/interfaces/auth-user.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(
    userId: string,
    email: string,
    organizationId: string,
    role: UserRole,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      organizationId,
      role,
    };

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') || 'dev_access_secret_change_in_production_min32';
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev_refresh_secret_change_in_production_min32';
    const accessExpiry = this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m';
    const refreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as unknown as Record<string, unknown>, {
        secret: accessSecret,
        expiresIn: accessExpiry as `${number}${'s' | 'm' | 'h' | 'd'}` | number,
      }),
      this.jwtService.signAsync(
        { sub: userId, type: 'refresh' } as Record<string, unknown>,
        {
          secret: refreshSecret,
          expiresIn: refreshExpiry as `${number}${'s' | 'm' | 'h' | 'd'}` | number,
        },
      ),
    ]);

    // Calculate expiry date for refresh token (default 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Persist refresh token hash
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, organizationName } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName.trim(),
          email: email.toLowerCase().trim(),
        },
      });

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
      });

      const membership = await tx.organizationMembership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: UserRole.ORG_ADMIN,
        },
      });

      return { user, organization, membership };
    });

    const tokens = await this.generateTokens(
      result.user.id,
      result.user.email,
      result.organization.id,
      result.membership.role,
    );

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
      },
      role: result.membership.role,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const activeMembership = user.memberships.find((m) => m.organization.isActive);
    if (!activeMembership) {
      throw new UnauthorizedException('No active organization associated with this account');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      activeMembership.organizationId,
      activeMembership.role,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      organization: {
        id: activeMembership.organization.id,
        name: activeMembership.organization.name,
      },
      role: activeMembership.role,
      ...tokens,
    };
  }

  async refresh(refreshDto: RefreshDto) {
    const { refreshToken } = refreshDto;
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev_refresh_secret_change_in_production_min32';

    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, { secret: refreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid, revoked, or expired');
    }

    // Revoke current token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        userId: payload.sub,
        isActive: true,
        organization: { isActive: true },
      },
      include: {
        user: true,
        organization: true,
      },
    });

    if (!membership || !membership.user.isActive) {
      throw new UnauthorizedException('User account or organization membership is no longer active');
    }

    const tokens = await this.generateTokens(
      membership.user.id,
      membership.user.email,
      membership.organizationId,
      membership.role,
    );

    return tokens;
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      return { message: 'Logged out' };
    }

    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Logged out successfully' };
  }
}
