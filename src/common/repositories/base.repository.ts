import {
  Document, Model, FilterQuery, UpdateQuery, QueryOptions, InsertManyOptions, ProjectionType, ClientSession, PipelineStage, PopulateOptions
} from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { startSession } from 'mongoose';
import { DefaultQueryOptions } from '../config/database.config';
import { PaginationDefaults } from '../config/repository.config';
import { winstonLogger } from '../../common/interceptors/winston-logger.config';

const { IS_LEAN } = DefaultQueryOptions;
const { defaultPage, defaultLimit, defaultSort } = PaginationDefaults;

/**
 * 페이징 옵션 인터페이스
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
  // populate?: string | string[];
}


export abstract class BaseRepository<T extends Document> {
  private readonly logger = winstonLogger;

  constructor(protected readonly model: Model<T>) {}

  /**
   * @param createDto 생성할 데이터
   * @param options 옵션
   * @returns 생성된 데이터
   */
  async create(createDto: Partial<T>, options?: QueryOptions): Promise<T> {
    const createdEntity = new this.model(createDto);
    return createdEntity.save(options);
  }

  /**
   * @param createDtos 생성할 데이터
   * @param options 옵션
   * @returns 생성된 데이터
   */
  async createMany(createDtos: Partial<T>[], options: InsertManyOptions = {}): Promise<T[]> {
    const result = await this.model.insertMany(createDtos, options);
    return result as unknown as T[];
  }

  /**
   * @param id 조회할 데이터의 id
   * @param projectionType 조회할 필드
   * @param options 옵션 (session 포함 가능)
   * @returns 조회된 데이터
   */
  async findById(id: string, projectionType?: ProjectionType<T>, options?: QueryOptions & { session?: ClientSession }): Promise<T | null> {
    return this.model.findById(id, projectionType, options).exec();
  }

  /**
   * @param filterQuery 조회할 데이터의 필터
   * @param isLean lean 옵션 (true: Plain Object, false: Document)
   * @param projectionType 조회할 필드
   * @param options 옵션 (session 포함 가능)
   * @returns 조회된 데이터
   */
  async findOne(filterQuery: FilterQuery<T>, isLean: boolean = IS_LEAN, projectionType?: ProjectionType<T>, options?: QueryOptions & { session?: ClientSession }): Promise<T | null> {
    return this.model.findOne(filterQuery, projectionType, { ...options, lean: isLean }).exec();
  }

  async findOrCreate(filterQuery: FilterQuery<T>, createDto: Partial<T>, isLean: boolean = IS_LEAN, options?: QueryOptions & { session?: ClientSession }): Promise<T> {
    return this.model.findOneAndUpdate(filterQuery, createDto, { new: true, upsert: true, ...options }).exec() as Promise<T>;
  }

  /**
   * @param filterQuery 조회할 데이터의 필터
   * @param projectionType 조회할 필드
   * @param options 옵션 (sort, session, lean 포함 가능)
   * @returns 조회된 데이터
   */
  async find(
    filterQuery: FilterQuery<T>, 
    projectionType?: ProjectionType<T>, 
    options?: QueryOptions
  ): Promise<T[]> {
    const { lean = IS_LEAN, ...restOptions } = options || {};
    return this.model.find(filterQuery, projectionType, { ...restOptions, lean }).exec();
  }

  /**
   * @param filterQuery 조회할 데이터의 필터
   * @param PaginationOptions 페이징 옵션 (page, limit, sort)
   * @param projectionType 조회할 필드
   * @param options 옵션 (lean, session, sort 등)
   * @returns 조회된 데이터
   */
  async findWithPagination(
    filterQuery: FilterQuery<T>,
    PaginationOptions: PaginationOptions,
    projectionType?: ProjectionType<T>,
    options?: QueryOptions,
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = defaultPage, limit = defaultLimit, sort = defaultSort } = PaginationOptions;
    const skip = (page - 1) * limit;

    const { lean = IS_LEAN, ...restOptions } = options || {};
    const [data, total] = await Promise.all([
      this.find(filterQuery, projectionType, {
        ...restOptions,
        skip,
        limit,
        sort: sort || restOptions.sort || defaultSort,
        lean
      }),
      this.count(filterQuery)
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * @param id 업데이트할 데이터의 id
   * @param updateQuery 업데이트할 데이터
   * @param options 옵션
   * @param session 세션
   * @param isLean 조회 결과를 JSON 객체로 반환할지 여부
   * @param returnDocument 반환할 데이터의 타입
   * @returns 업데이트된 데이터
   */
  async findByIdAndUpdate(
    id: string, 
    updateQuery: UpdateQuery<T>, 
    options?: QueryOptions, 
    session?: ClientSession,
    isLean: boolean = IS_LEAN,
    returnDocument: "after" | "before" = "after"
  ): Promise<T | null> {
    const queryOptions = { ...options, ...(session && { session }) };
    return this.model.findByIdAndUpdate(id, updateQuery, { new: true, ...queryOptions, lean: isLean, returnDocument }).exec();
  }

  /**
   * @param filterQuery 업데이트할 데이터의 필터
   * @param updateQuery 업데이트할 데이터
   * @param options 옵션
   * @param session 세션
   * @param isLean 조회 결과를 JSON 객체로 반환할지 여부
   * @param returnDocument 반환할 데이터의 타입
   * @returns 업데이트된 데이터
   */
  async findOneAndUpdate(
    filterQuery: FilterQuery<T>, 
    updateQuery: UpdateQuery<T>, 
    options?: QueryOptions, 
    session?: ClientSession, 
    isLean: boolean = IS_LEAN,
    returnDocument: "after" | "before" = "after"
  ): Promise<T | null> {
    const queryOptions = { ...options, ...(session && { session }) };
    return this.model.findOneAndUpdate(filterQuery, updateQuery, { new: true, ...queryOptions, lean: isLean, returnDocument }).exec();
  }

  /**
   * @param filterQuery 업데이트할 데이터의 필터
   * @param updateQuery 업데이트할 데이터
   * @param options 옵션
   * @param session 세션
   * @returns 업데이트된 데이터
   */
  async updateOne(
    filterQuery: FilterQuery<T>, 
    updateQuery: UpdateQuery<T>,
    options?: any, 
    session?: ClientSession, 
  ): Promise<{ matchedCount: number; modifiedCount: number; acknowledged: boolean }> {
    const updateOptions = { ...options, ...(session ? { session } : {}) };
    return this.model.updateOne(filterQuery, updateQuery, updateOptions).exec();
  }
  
  /** 
   * @param filterQuery 업데이터할 데이터의 필터
   * @param updateQuery 업데이트할 데이터
   * @param options 옵션
   * @param session 세션
   * @returns 업데이트된 데이터
   */
  async updateMany(
    filterQuery: FilterQuery<T>, 
    updateQuery: UpdateQuery<T>,
    options?: any, 
    session?: ClientSession, 
  ): Promise<{ matchedCount: number; modifiedCount: number; acknowledged: boolean }> {
    const updateOptions = { ...options, ...(session ? { session } : {}) };
    return this.model.updateMany(filterQuery, updateQuery, updateOptions).exec();
  }

  /**
   * @param id 삭제할 데이터의 id
   * @returns 삭제된 데이터
   */
  async findByIdAndDelete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  /**
   * @param filterQuery 삭제할 데이터의 필터
   * @returns 삭제된 데이터
   */
  async findOneAndDelete(filterQuery: FilterQuery<T>): Promise<T | null> {
    return this.model.findOneAndDelete(filterQuery).exec();
  }

  /**
   * @param filterQuery 삭제할 데이터의 필터
   */
  async deleteOne(filterQuery: FilterQuery<T>): Promise<void> {
    await this.model.deleteOne(filterQuery).exec();
  }
  
  /**
   * @param filterQuery 삭제할 데이터의 필터
   * @param options 옵션 (session 포함 가능)
   * @returns 삭제된 데이터의 개수
   */
  async deleteMany(
    filterQuery: FilterQuery<T>,
    options?: any
  ): Promise<number> {
    const result = await this.model.deleteMany(filterQuery, options).exec();
    return result.deletedCount;
  }

  /**
   * 실제 삭제는 하지 않고, isActive 필드를 false로 변경
   * @param id 소프트 삭제할 데이터의 id
   * @returns 소프트 삭제된 데이터
   */
  async softDelete(id: string): Promise<T | null> {
    return this.model.findByIdAndUpdate(
      id,
      { isActive: false, deletedAt: new Date() },
      { new: true }
    ).exec();
  }

  /**
   * 실제 삭제는 하지 않고, 전체 데이터의 isActive 필드를 false로 변경
   * @param filterQuery 소프트 삭제할 데이터의 필터
   * @returns 소프트 삭제된 데이터의 개수
   */
  async softDeleteMany(filterQuery: FilterQuery<T>): Promise<number> {
    const result = await this.model.updateMany(
      filterQuery,
      { isActive: false, deletedAt: new Date() }
    ).exec();
    return result.modifiedCount;
  }

  /**
   * @param filterQuery 조회할 데이터의 필터
   * @returns 조회된 데이터의 개수
   */
  async count(filterQuery: FilterQuery<T>): Promise<number> {
    return this.model.countDocuments(filterQuery).exec();
  }

  /**
   * @param filterQuery 조회할 데이터의 필터
   * @returns 조회된 데이터의 존재 여부
   */
  async exists(filterQuery: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.exists(filterQuery).exec();
    return count !== null;
  }

  /**
   * @param pipeline 집계 파이프라인
   * @returns 집계 결과
   */
  async aggregate(pipeline: PipelineStage[]): Promise<T[]> {
    return this.model.aggregate(pipeline).exec();
  }

  /**
   * @param id 조회할 데이터의 id
   * @param populate 패치할 필드
   * @param projectionType 조회할 필드
   * @param options 옵션
   * @param session 세션
   * @param sortOptions sort 옵션
   * @param isLean 조회 결과를 JSON 객체로 반환할지 여부
   * @returns 조회된 데이터
   */
  async findByIdWithPopulate< R = T> (
    id: string, 
    populate: PopulateOptions | PopulateOptions[], 
    projectionType?: ProjectionType<T>, 
    options?: QueryOptions, 
    session?: ClientSession, 
    sortOptions?: any, 
    isLean: boolean = IS_LEAN)
    : Promise<R | null> {
    const queryOptions = { ...options, ...(session && { session }) };
    return this.model.findById(id, projectionType, { ...queryOptions, sort: sortOptions, lean: isLean })
      .populate(populate).exec() as R | null;
  }

  /**
   * @param filterQuery 조회할 데이터의 필터
   * @param populate 패치할 필드
   * @param projectionType 조회할 필드
   * @returns 조회된 단일 데이터
   */
  async findOneWithPopulate<R = T>(
    filterQuery: FilterQuery<T>,
    populate: PopulateOptions | PopulateOptions[],
    projectionType?: ProjectionType<T>
  ): Promise<R | null> {
    return this.model.findOne(filterQuery, projectionType, { lean: IS_LEAN })
      .populate(populate).exec() as R | null;
  }

  /**
   * @param filterQuery 조회할 데이터의 필터
   * @param populate 패치할 필드
   * @returns 조회된 데이터
   */
  async findWithPopulate(
    filterQuery: FilterQuery<T>,
    populate: PopulateOptions | PopulateOptions[],
    projectionType?: ProjectionType<T>,
    options?: QueryOptions,
    session?: ClientSession,
    sortOptions?: any,
    isLean: boolean = IS_LEAN
  ): Promise<T[]> {
    const queryOptions = { ...options, ...(session && { session }) };
    return this.model.find(filterQuery, projectionType, { ...queryOptions, sort: sortOptions, lean: isLean })
      .populate(populate).exec();
  }

  /**
   * @param filterQuery 조회할 데이터의 필터
   * @param populate 패치할 필드
   * @param page 페이지
   * @param limit 페이지당 데이터 개수
   * @param options 옵션
   * @param session 세션
   * @param sortOptions sort 옵션
   * @param isLean 조회 결과를 JSON 객체로 반환할지 여부
   * @returns 조회된 데이터
   */
  async findWithPopulateAndPagination(
    filterQuery: FilterQuery<T>, 
    populate: PopulateOptions | PopulateOptions[], 
    PaginationOptions: PaginationOptions,
    projectionType?: ProjectionType<T>,
    options?: QueryOptions,
    session?: ClientSession,
    sortOptions?: any,
    isLean: boolean = IS_LEAN
  ): Promise<T[]> {
    const { page = defaultPage, limit = defaultLimit, sort = defaultSort } = PaginationOptions;
    const skip = (page - 1) * limit;
    const queryOptions = { ...options, skip, limit, sort, ...(session && { session }) };
    return this.findWithPopulate(filterQuery, populate, projectionType, { ...queryOptions, session, sortOptions, isLean });
  }

  /**
   * mongodb 지원 버전 확인
   * @param callback 트랜잭션 콜백
   * @returns 트랜잭션 결과
   */
  async findWithTransaction<R>(
    callback: (session: any) => Promise<R>
  ): Promise<R> {
    const session = await startSession();
    session.startTransaction();
    
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      // await session.abortTransaction(); // 연결이 끊겼을 경우에 문제가 생김
      session.abortTransaction().catch(err => {
        this.logger.error('Abort failed', err);
      });
      throw error;
    } finally {
      await session.endSession();
    }
  }
}