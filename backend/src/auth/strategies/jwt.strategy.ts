import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser, JwtPayload } from '../../common/interfaces/auth-user.interface.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'dev_access_secret_change_in_production_min32',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.organizationId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const membership = await this.prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: payload.sub,
          organizationId: payload.organizationId,
        },
      },
      include: {
        user: true,
        organization: true,
      },
    });

    if (!membership || !membership.isActive || !membership.user.isActive || !membership.organization.isActive) {
      throw new UnauthorizedException('User account or organization is inactive');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
      role: membership.role,
    };
  }
}
