import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SSOTokens } from '../../../common/interfaces/sso-provider.interface';

export interface TokenPayload {
  sub: string;
  username: string;
  email: string;
  authProvider: string;
  roles: string[];
}

export interface RefreshTokenPayload {
  sub: string;
  username: string;
}

export interface IdTokenPayload {
  sub: string;
  email: string;
  username: string;
  authProvider: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 전체 토큰 세트 발급 (access, refresh, id)
   */
  generateTokens(payload: {
    userId: string;
    username: string;
    email: string;
    authProvider: string;
    roles?: string[];
  }): SSOTokens {
    const { userId, username, email, authProvider, roles = [] } = payload;

    const accessToken = this.generateAccessToken({
      sub: userId,
      username,
      email,
      authProvider,
      roles,
    });

    const refreshToken = this.generateRefreshToken({
      sub: userId,
      username,
    });

    const idToken = this.generateIdToken({
      sub: userId,
      email,
      username,
      authProvider,
    });

    return {
      accessToken,
      refreshToken,
      idToken,
    };
  }

  /**
   * Access Token 발급
   */
  generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });
  }

  /**
   * Refresh Token 발급
   */
  generateRefreshToken(payload: RefreshTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });
  }

  /**
   * ID Token 발급
   */
  generateIdToken(payload: IdTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ID_TOKEN_EXPIRES_IN'),
    });
  }

  /**
   * 토큰 검증
   */
  verifyAccessToken(token: string): TokenPayload {
    return this.jwtService.verify<TokenPayload>(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Refresh Token 검증
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.jwtService.verify<RefreshTokenPayload>(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }
}
