import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { UserProvider, USER_PROVIDER } from '../interfaces/user-provider.interface';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    @Inject(USER_PROVIDER) private userProvider: UserProvider,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret-key',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const { sub: userId, email } = payload;

    if (!userId || !email) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const user = await this.userProvider.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
    };
  }
}