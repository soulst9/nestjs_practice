import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  phone: string;
  authProvider: string;
  roles: Array<{
    roleType: number;
  }>;
  iat?: number;
  exp?: number;
}

export interface JwtUser {
  id: string;
  userId: string;
  username: string;
  email: string;
  phone: string;
  authProvider: string;
  roles: Array<{
    roleType: number;
  }>;
}

/**
 * JWT 전략
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.accessToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'access-secret-key',
    });
  }

  /**
   * 페이로드 검증
   * @param payload 페이로드
   * @returns
   */
  async validate(payload: JwtPayload): Promise<JwtUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      phone: payload.phone,
      authProvider: payload.authProvider,
      roles: payload.roles || []
    };
  }
}