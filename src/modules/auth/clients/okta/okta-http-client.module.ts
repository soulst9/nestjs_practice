import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OktaHttpClientService } from './okta-http-client.service';
import oktaConfig from '../../../../common/config/okta.config';

/**
 * Okta HTTP Client Module
 *
 * Okta OAuth 2.0 API 통신을 위한 공통 모듈
 * 다른 모듈에서 OktaHttpClientService를 주입받아 사용할 수 있습니다.
 *
 * @example
 * // auth.module.ts
 * @Module({
 *   imports: [OktaHttpClientModule],
 *   providers: [AuthService],
 * })
 * export class AuthModule {}
 *
 * // auth.service.ts
 * constructor(private oktaClient: OktaHttpClientService) {}
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule.forFeature(oktaConfig),
  ],
  providers: [OktaHttpClientService],
  exports: [OktaHttpClientService],
})
export class OktaHttpClientModule {}
