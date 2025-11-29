import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import oktaConfig from '../../common/config/okta.config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OktaStrategy } from './strategies/okta.strategy';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OktaAuthGuard } from './guards/okta-auth.guard';

import { UsersModule } from '../users/user.module';
import { OktaHttpClientModule } from './clients/okta/okta-http-client.module';

@Module({
  imports: [
    ConfigModule.forFeature(oktaConfig),
    ConfigModule,
    PassportModule,
    UsersModule,
    OktaHttpClientModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'temp-secret-key',
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h' 
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    PasswordService,
    JwtStrategy,
    OktaStrategy,
    // 글로벌 가드 설정
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    OktaAuthGuard,
  ],
  exports: [AuthService, TokenService, PasswordService],
})
export class AuthModule {}