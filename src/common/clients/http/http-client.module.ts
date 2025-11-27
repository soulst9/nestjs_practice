import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpClientService } from './http-client.service';

/**
 * 범용 HTTP Client Module
 *
 * @Global 데코레이터로 전역 모듈로 설정
 * 모든 모듈에서 import 없이 HttpClientService 주입 가능
 *
 * Redis처럼 인프라 레이어 서비스이므로 전역으로 제공
 *
 * @example
 * // app.module.ts
 * @Module({
 *   imports: [HttpClientModule],
 * })
 *
 * // 어떤 서비스에서든 바로 사용
 * constructor(private httpClient: HttpClientService) {}
 */
@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class HttpClientModule {}
