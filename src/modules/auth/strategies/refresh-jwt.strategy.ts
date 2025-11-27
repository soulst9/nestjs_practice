import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../../users/services/user.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
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
    // Refresh token에서 사용자 정보 추출
    const { sub: userId, email } = payload;
    
    if (!userId || !email) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    // 사용자 존재 여부 확인
    const user = await this.usersService.findByEmail({ email });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 사용자 활성 상태 확인
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