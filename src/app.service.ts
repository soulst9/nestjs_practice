import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RedisService } from './common/redis/redis.service';

@Injectable()
export class AppService {
  constructor(
    @InjectConnection() private readonly mongo: Connection,
    private readonly redis: RedisService,
  ) {}

  /**
   * MongoDB 연결 상태 확인
   * @returns 
   */
  async pingMongo(): Promise<boolean> {
    try {
      return this.mongo.readyState === 1;
    } catch {
      return false;
    }
  }

  /**
   * Redis 연결 상태 확인
   * @returns 
   */
  async pingRedis(): Promise<boolean> {
    try {
      await this.redis.getClient().ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * API 서버 상태 확인
   * @returns 
   */
  async health() {
    const [mongo, redis] = await Promise.all([this.pingMongo(), this.pingRedis()]);
      return {
        status: mongo && redis ? 'ok' : 'degraded',
        checks: { mongo, redis },
        timestamp: new Date().toISOString(),
      };
  }
}