import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';
import { winstonLogger } from '../interceptors/winston-logger.config';
import { RedisConnectionFailedException } from '../exceptions/redis.exception';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = winstonLogger;

  private client: RedisClientType;
  private maxReconnectAttempts = 15;

  constructor(private configService: ConfigService) {
    this.client = createClient({
      socket: {
        host: this.configService.get<string>('REDIS_HOST') || 'localhost',
        port: parseInt(this.configService.get<string>('REDIS_PORT') || '6379', 10),
        connectTimeout: 1000 * 30,
        reconnectStrategy: (retries: number): number | Error => {
          const attempt = retries + 1;
          this.logger.info(`Redis reconnectStrategy: ${attempt}`);

          // 최대 재연결 시도 초과시 예외 발생
          if (attempt >= this.maxReconnectAttempts) {
            return new RedisConnectionFailedException();
          }

          // 지수 백오프 전략
          return Math.min(Math.pow(2, retries) * 50, 5000) + Math.floor(Math.random() * 200);
        }
      },
      password: this.configService.get<string>('REDIS_PASSWORD'),
      database: parseInt(this.configService.get<string>('REDIS_DB') || '0', 10),
    });

    this.client.on('connect', () => {
      this.logger.info(`Redis connected`);
    });

    this.client.on('error', async (err) => {
      this.logger.error(`Redis Client Error: ${err.message}`);
    });
  }

  /**
   * redis 연결
   */
  async onModuleInit(): Promise<void> {
    try {
        await this.client.connect();
        this.logger.info(`Redis onModuleInit`);
      } catch (error) {
        this.logger.error(`Failed to connect to Redis: ${error.message}`);
        throw error;
      }    
  }

  /**
   * redis 연결 종료
   */
  async onModuleDestroy(): Promise<void> {
    try {
        if (this.client.isOpen) {
          await Promise.race([
            this.client.quit(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Redis quit() timeout')), 1000 * 30)),
          ]);
        }
      } catch (error) {
        try {
          await this.client.destroy();
        } catch (error) {
          this.logger.error(`Error disconnecting from Redis: ${error.message}`);
        }
        this.logger.error(`Error disconnecting from Redis: ${error.message}`);
      }    
  }


  /**
   * redis 클라이언트
   */
  getClient(): RedisClientType {
    return this.client;
  }

  /**
   * 복제
   */
  async duplicate(): Promise<RedisClientType> {
    return await this.client.duplicate();
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number = 1000 * 3): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Redis operation timeout')), timeout));
    return Promise.race([operation(), timeoutPromise]);
  }


  /**
   * 설정
   * @param key 
   * @param value 
   * @param ttl 
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.executeWithTimeout(() =>
      ttl ? this.client.setEx(key, ttl, value) : this.client.set(key, value)
    );
  }

  /**
   * 조회
   * @param key 
   */
  async get(key: string): Promise<string | null> {
    return await this.executeWithTimeout(() => this.client.get(key));
  }

  /**
   * 삭제
   * @param key 
   */
  async del(key: string): Promise<number> {
    return await this.executeWithTimeout(() => this.client.del(key));
  }

  /**
   * 존재 여부
   * @param key 
   */
  async exists(key: string): Promise<number> {
    return await this.executeWithTimeout(() => this.client.exists(key));
  }

  /**
   * 1 증가
   * @param key 
   */
  async incr(key: string): Promise<number> {
    return await this.executeWithTimeout(() => this.client.incr(key));
  }

  /**
   * 1 감소
   * @param key 
   */
  async decr(key: string): Promise<number> {
    return await this.executeWithTimeout(() => this.client.decr(key));
  }

  /**
   * n 증가
   * @param key 
   */
  async incrBy(key: string, value: number): Promise<number> {
    return await this.executeWithTimeout(() => this.client.incrBy(key, value));
  }

  /**
   * n 감소
   * @param key 
   * @param value 
   */
  async decrBy(key: string, value: number): Promise<number> {
    return await this.executeWithTimeout(() => this.client.decrBy(key, value));
  }

  /******************* Hash 관련 명령어 *******************/
  /**
   * 설정
   * @param key 
   * @param field 
   * @param value 
   */
  async hSet(key: string, field: string, value: string): Promise<number> {
    return await this.executeWithTimeout(() => this.client.hSet(key, field, value));
  }

  /**
   * hash 조회
   * @param key 
   * @param field 
   */
  async hGet(key: string, field: string): Promise<string | null> {
    return await this.executeWithTimeout(() => this.client.hGet(key, field));
  }

  /**
   * hash 전체 조회
   * @param key 
   */
  async hGetAll(key: string): Promise<Record<string, string>> {
    return await this.executeWithTimeout(() => this.client.hGetAll(key));
  }

  /**
   * hash 삭제
   * @param key 
   * @param field 
   */
  async hDel(key: string, field: string): Promise<number> {
    return await this.executeWithTimeout(() => this.client.hDel(key, field));
  }
  
  /**
   * hash 존재 여부
   * @param key 
   * @param field 
   */
  async hExists(key: string, field: string): Promise<number> {
    return await this.executeWithTimeout(() => this.client.hExists(key, field));
  }

  /******************* 만료 관련 명령어 *******************/
  /**
   * 만료 시간 설정
   */
  async expire(key: string, ttl: number): Promise<number> {
    return await this.executeWithTimeout(() => this.client.expire(key, ttl));
  }

  /**
   * 만료 시간 조회
   * @param key 
   */
  async ttl(key: string): Promise<number> {
    return await this.executeWithTimeout(() => this.client.ttl(key));
  }

  /**
   * 만료 시간 제거
   * @param key 
   */
  async persist(key: string): Promise<number> {
    return await this.executeWithTimeout(() => this.client.persist(key));
  }

  /**
   * 특정 시간 만료
   * @param key 
   * @param ttl 
   */
  async expireAt(key: string, ttl: number): Promise<number> {
    return await this.executeWithTimeout(() => this.client.expireAt(key, ttl));
  }

  /**
   * 절대 시간(밀리초)에 만료되는 캐시 설정
   * @param key Redis 키
   * @param value 저장할 값
   * @param expiry 만료 시각 (밀리초 Unix timestamp)
   * @example
   * const expireAt = new Date('2025-01-15T02:00:00Z');
   * await setAndExpireAt('key', 'value', expireAt.getTime());
   */
  async setAndExpireAt(key: string, value: string, expiry: number): Promise<void> {
    await this.executeWithTimeout(() => 
      this.client.set(key, value, {
        expiration: {
          type: 'PXAT',
          value: expiry
        }
      })
    );    
  }

  /******************* List 관련 명령어 *******************/
  /**
   * List 추가
   */
  async lPush(key: string, value: string): Promise<number> {
    return await this.executeWithTimeout(() => this.client.lPush(key, value));
  }

  /**
   * List 조회
   * @param key 
   */
  async lRange(key: string, start: number, end: number): Promise<string[]> {
    return await this.executeWithTimeout(() => this.client.lRange(key, start, end));
  }

  /**
   * List 삭제
   * @param key 
   */
  async lPop(key: string): Promise<string | null> {
    return await this.executeWithTimeout(() => this.client.lPop(key));
  }

  /**
   * List 길이
   * @param key 
   */
  async lLen(key: string): Promise<number> {
    return await this.executeWithTimeout(() => this.client.lLen(key));
  }
  
  /**
   * List 특정 index 조회
   * @param key 
   * @param index 
   */
  async lIndex(key: string, index: number): Promise<string | null> {
    return await this.executeWithTimeout(() => this.client.lIndex(key, index));
  }

  /**
   * List 특정 값 설정
   */
  async lSet(key: string, index: number, value: string): Promise<string> {
    return await this.executeWithTimeout(() => this.client.lSet(key, index, value));
  }

  /**
   * List 특정 값 삭제
   */
  async lRem(key: string, index: number, value: string): Promise<number> {
    return await this.executeWithTimeout(() => this.client.lRem(key, index, value));
  }
  
  /**
   * 분산 락 획득 (SET NX EX)
   * @param key 락 키
   * @param value 락 소유자 식별자 (UUID 등)
   * @param ttl 만료 시간(초)
   * @returns 락 획득 성공 여부
   */
  async acquireLock(key: string, value: string, ttl: number): Promise<boolean> {
    return await this.executeWithTimeout(() => 
      this.client.set(key, value, { NX: true, EX: ttl })
        .then(result => result === 'OK')
    );
  }

  /**
   * 분산 락 해제 (소유자 검증 포함)
   * @param key 락 키
   * @param value 락 소유자 식별자
   */
  async releaseLock(key: string, value: string): Promise<void> {
    const currentValue = await this.get(key);
    if (currentValue === value) {
      await this.del(key);
    }
  }
}