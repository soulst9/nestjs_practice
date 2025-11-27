import { BaseRepository } from "src/common/repositories/base.repository";
import { RedisService } from "src/common/redis/redis.service";
import { FilterQuery, Document } from "mongoose";
import { winstonLogger } from "src/common/interceptors/winston-logger.config";
import { TTLConfig } from "src/common/config/ttl.config";

const logger = winstonLogger;

type CacheExpiry = number | Date;

export const repositoryCache = <T extends Document>(repository: BaseRepository<T>, redisService: RedisService) => {

  async function setCacheWithExpiry(cacheKey: string, data: T, expiry: CacheExpiry) {
    if (typeof expiry === 'number') {
      await redisService.set(cacheKey, JSON.stringify(data), expiry);
    } else {
      const expiryTimestamp = expiry.getTime();
      const now = Date.now();

      if (expiryTimestamp <= now) {
        winstonLogger.warn(`Expiry timestamp is in the past for ${cacheKey}`);
        return;
      }
      
      await redisService.setAndExpireAt(cacheKey, JSON.stringify(data), expiryTimestamp);
    }
  }

  /**
   * 캐시 조회 (null 허용)
   * @param cacheKey 캐시 키
   * @param fetchOperation 캐시 조회 함수
   * @param ttl 캐시 만료 시간
   * @returns 캐시 조회 데이터
   */
  const findWithCache = async <R = T | T[]>(
    cacheKey: string,
    fetchOperation: () => Promise<R>,
    // ttl?: number
    expiry?: CacheExpiry
  ): Promise<R> => {
    const cached = await redisService.get(cacheKey);
    if (cached) {
      logger.info(`Cache hit for ${cacheKey}`);
      return JSON.parse(cached) as R;
    }
    const data = await fetchOperation();

    if (data) {
      await setCacheWithExpiry(cacheKey, data as T, expiry || TTLConfig.duration.hourly);
      logger.info(`Cache set for ${cacheKey}`);
    }
    return data;
  }

  /**
   * 캐시 조회 (NotFound 예외 처리)
   * @param cacheKey 캐시 키
   * @param fetchOperation 캐시 조회 함수 (findOneOrThrow 등)
   * @param expiry 캐시 만료 시간
   * @returns 캐시 조회 데이터 (항상 존재)
   */
  // TODO(human): Implement findWithCacheOrThrow method


  /**
   * 캐시 생성
   * @param cacheKey 캐시 키
   * @param createOperation 캐시 생성 함수
   * @param ttl 캐시 만료 시간
   * @returns 캐시 생성 데이터
   */
  const createWithCache = async (
    cacheKey: string,
    createOperation: () => Promise<T>,
    ttl?: number
  ) => {
    const data = await createOperation();
    if (data) {
      await redisService.set(cacheKey, JSON.stringify(data), ttl || TTLConfig.duration.hourly);
      logger.info(`Cache set for ${data.id}`);
    }
    return data;
  }

  /**
   * 캐시 업데이트
   * @param cacheKey 캐시 키
   * @param updateOperation 캐시 업데이트 함수
   * @param ttl 캐시 만료 시간
   * @returns 업데이트된 데이터
   */
  const updateWithCache = async (
    cacheKey: string,
    updateOperation: () => Promise<T>,
    ttl?: number
  ) => {
    const data = await updateOperation();
    if (data) {
      await redisService.set(cacheKey, JSON.stringify(data), ttl || TTLConfig.duration.hourly);
      logger.info(`Cache set for ${cacheKey}`);
    }
    return data;
  }

  /**
   * 캐시 삭제
   * @param cacheKey 캐시 키
   * @param deleteOperation 캐시 삭제 함수
   * @returns 삭제된 데이터
   */
  const deleteWithCache = async (
    cacheKey: string,
    deleteOperation: () => Promise<T>,
  ) => {
    const data = await deleteOperation();
    await redisService.del(cacheKey);
    logger.info(`Cache deleted for ${cacheKey}`);
    return data;
  }

  return {
    findWithCache,
    createWithCache,
    updateWithCache,
    deleteWithCache,
  }
};