import {
  Document, Model, FilterQuery, UpdateQuery, QueryOptions, InsertManyOptions, ProjectionType, ClientSession, PipelineStage, PopulateOptions
} from 'mongoose';
import { startSession } from 'mongoose';
import { DefaultQueryOptions } from '../config/database.config';
import { PaginationDefaults } from '../config/repository.config';
import { winstonLogger } from '../../common/interceptors/winston-logger.config';
import {
  BaseRepository,
  PaginationOptions,
  PaginatedResult,
  UpdateResult,
} from './interfaces/base-repository.interface';

const { IS_LEAN } = DefaultQueryOptions;
const { defaultPage, defaultLimit, defaultSort } = PaginationDefaults;

/**
 * Mongoose 전용 옵션 인터페이스
 */
export interface MongooseQueryOptions<T> {
  select?: ProjectionType<T>;
  lean?: boolean;
  sort?: Record<string, 1 | -1>;
}

/**
 * Mongoose 기반 MongoDB용 Repository
 * BaseRepository 인터페이스 구현
 */
export abstract class MongooseRepository<T extends Document>
  implements BaseRepository<T, string>
{
  private readonly logger = winstonLogger;

  constructor(protected readonly model: Model<T>) {}

  /**
   * 엔티티 생성
   */
  async create(createDto: Partial<T>, session?: ClientSession): Promise<T> {
    const createdEntity = new this.model(createDto);
    return createdEntity.save({ session });
  }

  /**
   * 여러 엔티티 생성
   */
  async createMany(createDtos: Partial<T>[], options: InsertManyOptions = {}): Promise<T[]> {
    const result = await this.model.insertMany(createDtos, options);
    return result as unknown as T[];
  }

  /**
   * ID로 엔티티 조회
   */
  async findById(
    id: string,
    options?: MongooseQueryOptions<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model
      .findById(id, options?.select, { session, lean: options?.lean ?? IS_LEAN })
      .exec();
  }

  /**
   * 조건으로 단일 엔티티 조회
   */
  async findOne(
    where: FilterQuery<T>,
    options?: MongooseQueryOptions<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model
      .findOne(where, options?.select, { session, lean: options?.lean ?? IS_LEAN })
      .exec();
  }

  /**
   * 조건으로 여러 엔티티 조회
   */
  async find(
    where: FilterQuery<T>,
    options?: MongooseQueryOptions<T> & QueryOptions,
    session?: ClientSession,
  ): Promise<T[]> {
    const { lean = IS_LEAN, select, sort, ...restOptions } = options || {};
    return this.model
      .find(where, select, { ...restOptions, session, lean, sort })
      .exec();
  }

  /**
   * 조건으로 엔티티 조회 또는 생성
   */
  async findOrCreate(
    where: FilterQuery<T>,
    createDto: Partial<T>,
    session?: ClientSession,
  ): Promise<T> {
    return this.model
      .findOneAndUpdate(where, createDto, { new: true, upsert: true, session })
      .exec() as Promise<T>;
  }

  /**
   * 페이징 조회
   */
  async findWithPagination(
    where: FilterQuery<T>,
    paginationOptions: PaginationOptions,
    options?: MongooseQueryOptions<T>,
    session?: ClientSession,
  ): Promise<PaginatedResult<T>> {
    const { page = defaultPage, limit = defaultLimit, sort } = paginationOptions;
    const skip = (page - 1) * limit;

    const querySort = (sort as Record<string, 1 | -1>) || options?.sort || defaultSort;

    const [data, total] = await Promise.all([
      this.find(where, { ...options, skip, limit, sort: querySort }, session),
      this.count(where, session),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * ID로 엔티티 업데이트 후 반환
   */
  async findByIdAndUpdate(
    id: string,
    updateDto: Partial<T>,
    options?: MongooseQueryOptions<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, updateDto as UpdateQuery<T>, {
        new: true,
        session,
        lean: options?.lean ?? IS_LEAN,
      })
      .exec();
  }

  /**
   * 조건으로 엔티티 업데이트 후 반환
   */
  async findOneAndUpdate(
    where: FilterQuery<T>,
    updateDto: Partial<T>,
    options?: MongooseQueryOptions<T>,
    session?: ClientSession,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(where, updateDto as UpdateQuery<T>, {
        new: true,
        session,
        lean: options?.lean ?? IS_LEAN,
      })
      .exec();
  }

  /**
   * 단일 엔티티 업데이트
   */
  async updateOne(
    where: FilterQuery<T>,
    updateDto: Partial<T>,
    session?: ClientSession,
  ): Promise<UpdateResult> {
    const result = await this.model
      .updateOne(where, updateDto as UpdateQuery<T>, { session })
      .exec();
    return {
      affected: result.modifiedCount,
      raw: result,
    };
  }

  /**
   * 여러 엔티티 업데이트
   */
  async updateMany(
    where: FilterQuery<T>,
    updateDto: Partial<T>,
    session?: ClientSession,
  ): Promise<UpdateResult> {
    const result = await this.model
      .updateMany(where, updateDto as UpdateQuery<T>, { session })
      .exec();
    return {
      affected: result.modifiedCount,
      raw: result,
    };
  }

  /**
   * ID로 엔티티 삭제 후 반환
   */
  async findByIdAndDelete(id: string, session?: ClientSession): Promise<T | null> {
    return this.model.findByIdAndDelete(id, { session }).exec();
  }

  /**
   * 조건으로 엔티티 삭제 후 반환
   */
  async findOneAndDelete(where: FilterQuery<T>, session?: ClientSession): Promise<T | null> {
    return this.model.findOneAndDelete(where, { session }).exec();
  }

  /**
   * 조건으로 단일 엔티티 삭제
   */
  async deleteOne(where: FilterQuery<T>, session?: ClientSession): Promise<void> {
    await this.model.deleteOne(where, { session }).exec();
  }

  /**
   * 조건으로 여러 엔티티 삭제
   */
  async deleteMany(where: FilterQuery<T>, session?: ClientSession): Promise<number> {
    const result = await this.model.deleteMany(where, { session }).exec();
    return result.deletedCount;
  }

  /**
   * 소프트 삭제 (isActive = false, deletedAt 설정)
   */
  async softDelete(id: string, session?: ClientSession): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        { isActive: false, deletedAt: new Date() } as UpdateQuery<T>,
        { new: true, session },
      )
      .exec();
  }

  /**
   * 조건으로 여러 엔티티 소프트 삭제
   */
  async softDeleteMany(where: FilterQuery<T>, session?: ClientSession): Promise<number> {
    const result = await this.model
      .updateMany(where, { isActive: false, deletedAt: new Date() } as UpdateQuery<T>, { session })
      .exec();
    return result.modifiedCount;
  }

  /**
   * 조건으로 엔티티 개수 조회
   */
  async count(where: FilterQuery<T>, session?: ClientSession): Promise<number> {
    return this.model.countDocuments(where, { session }).exec();
  }

  /**
   * 조건으로 엔티티 존재 여부 확인
   */
  async exists(where: FilterQuery<T>, session?: ClientSession): Promise<boolean> {
    const result = await this.model.exists(where).session(session ?? null).exec();
    return result !== null;
  }

  /**
   * 트랜잭션 실행
   */
  async withTransaction<R>(callback: (session: ClientSession) => Promise<R>): Promise<R> {
    const session = await startSession();
    session.startTransaction();

    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      session.abortTransaction().catch((err) => {
        this.logger.error('Abort failed', err);
      });
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // ============ Mongoose 전용 메서드 (인터페이스 외) ============

  /**
   * 집계 파이프라인 실행
   */
  async aggregate<R = T>(pipeline: PipelineStage[]): Promise<R[]> {
    return this.model.aggregate(pipeline).exec();
  }

  /**
   * ID로 관계 포함 조회
   */
  async findByIdWithPopulate<R = T>(
    id: string,
    populate: PopulateOptions | PopulateOptions[],
    options?: MongooseQueryOptions<T>,
    session?: ClientSession,
  ): Promise<R | null> {
    return this.model
      .findById(id, options?.select, { session, lean: options?.lean ?? IS_LEAN, sort: options?.sort })
      .populate(populate)
      .exec() as Promise<R | null>;
  }

  /**
   * 조건으로 관계 포함 단일 조회
   */
  async findOneWithPopulate<R = T>(
    where: FilterQuery<T>,
    populate: PopulateOptions | PopulateOptions[],
    options?: MongooseQueryOptions<T>,
  ): Promise<R | null> {
    return this.model
      .findOne(where, options?.select, { lean: options?.lean ?? IS_LEAN })
      .populate(populate)
      .exec() as Promise<R | null>;
  }

  /**
   * 조건으로 관계 포함 다중 조회
   */
  async findWithPopulate(
    where: FilterQuery<T>,
    populate: PopulateOptions | PopulateOptions[],
    options?: MongooseQueryOptions<T>,
    session?: ClientSession,
  ): Promise<T[]> {
    return this.model
      .find(where, options?.select, { session, lean: options?.lean ?? IS_LEAN, sort: options?.sort })
      .populate(populate)
      .exec();
  }

  /**
   * 관계 포함 페이징 조회
   */
  async findWithPopulateAndPagination(
    where: FilterQuery<T>,
    populate: PopulateOptions | PopulateOptions[],
    paginationOptions: PaginationOptions,
    options?: MongooseQueryOptions<T>,
    session?: ClientSession,
  ): Promise<T[]> {
    const { page = defaultPage, limit = defaultLimit, sort } = paginationOptions;
    const skip = (page - 1) * limit;
    const querySort = (sort as Record<string, 1 | -1>) || options?.sort || defaultSort;

    return this.model
      .find(where, options?.select, {
        session,
        lean: options?.lean ?? IS_LEAN,
        skip,
        limit,
        sort: querySort,
      })
      .populate(populate)
      .exec();
  }
}

// 하위 호환성을 위한 alias export
export { MongooseRepository as BaseRepository };
