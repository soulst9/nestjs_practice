import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * API 서버 상태 확인
   * mongo, redis 연결 상태 확인
   * @returns 
   */
  @Get('health')
  health() {
    return this.appService.health();
  }
}