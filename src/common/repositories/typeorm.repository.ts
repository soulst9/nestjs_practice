import {
  Repository,
  DeepPartial,
  FindOptionsWhere,
  FindOptionsSelect,
  FindOptionsOrder,
  FindOptionsRelations,
  DataSource,
  EntityManager,
  SelectQueryBuilder,
  ObjectLiteral,
} from 'typeorm';
import { winstonLogger } from '../../common/interceptors/winston-logger.config';
import { PaginationDefaults } from '../config/repository.config';
import {
  BaseRepository,
  PaginationOptions,
  PaginatedResult,
  UpdateResult,
} from './interfaces/base-repository.interface';

const { defaultPage, defaultLimit } = PaginationDefaults;

/**
 * TypeORM 전용 옵션 인터페이스
 */
export interface TypeOrmQueryOptions<T> {
  select?: FindOptionsSelect<T>;
  order?: FindOptionsOrder<T>;
  relations?: FindOptionsRelations<T>;
}

/**
 * TypeORM 기반 PostgreSQL용 Repository
 * BaseRepository 인터페이스 구현
 */
export abstract class TypeOrmRepository<T extends ObjectLiteral & { id: string | number }>
  implements BaseRepository<T, string | number>
{
  private readonly logger = winstonLogger;

  constructor(
    protected readonly repository: Repository<T>,
    protected readonly dataSource: DataSource,
  ) {}

  /**
   * 엔티티 생성
   */
  async create(createDto: Partial<T>, manager?: EntityManager): Promise<T> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    const entity = repo.create(createDto as DeepPartial<T>);
    return repo.save(entity);
  }

  /**
   * 여러 엔티티 생성
   */
  async createMany(createDtos: Partial<T>[], manager?: EntityManager): Promise<T[]> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    const entities = repo.create(createDtos as DeepPartial<T>[]);
    return repo.save(entities);
  }

  /**
   * ID로 엔티티 조회
   */
  async findById(
    id: string | number,
    options?: TypeOrmQueryOptions<T>,
    manager?: EntityManager,
  ): Promise<T | null> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    return repo.findOne({
      where: { id } as FindOptionsWhere<T>,
      select: options?.select,
      order: options?.order,
      relations: options?.relations,
    });
  }

  /**
   * 조건으로 단일 엔티티 조회
   */
  async findOne(
    where: FindOptionsWhere<T>,
    options?: TypeOrmQueryOptions<T>,
    manager?: EntityManager,
  ): Promise<T | null> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    return repo.findOne({
      where,
      select: options?.select,
      order: options?.order,
      relations: options?.relations,
    });
  }

  /**
   * 조건으로 여러 엔티티 조회
   */
  async find(
    where: FindOptionsWhere<T>,
    options?: TypeOrmQueryOptions<T>,
    manager?: EntityManager,
  ): Promise<T[]> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    return repo.find({
      where,
      select: options?.select,
      order: options?.order,
      relations: options?.relations,
    });
  }

  /**
   * 조건으로 엔티티 조회 또는 생성
   */
  async findOrCreate(
    where: FindOptionsWhere<T>,
    createDto: Partial<T>,
    manager?: EntityManager,
  ): Promise<T> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    const existing = await repo.findOne({ where });
    if (existing) {
      return existing;
    }
    const entity = repo.create(createDto as DeepPartial<T>);
    return repo.save(entity);
  }

  /**
   * 페이징 조회
   */
  async findWithPagination(
    where: FindOptionsWhere<T>,
    paginationOptions: PaginationOptions,
    options?: TypeOrmQueryOptions<T>,
    manager?: EntityManager,
  ): Promise<PaginatedResult<T>> {
    const { page = defaultPage, limit = defaultLimit, sort } = paginationOptions;
    const skip = (page - 1) * limit;

    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    const [data, total] = await repo.findAndCount({
      where,
      select: options?.select,
      order: (sort as FindOptionsOrder<T>) || options?.order,
      relations: options?.relations,
      skip,
      take: limit,
    });

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
    id: string | number,
    updateDto: Partial<T>,
    options?: TypeOrmQueryOptions<T>,
    manager?: EntityManager,
  ): Promise<T | null> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    await repo.update(id, updateDto as any);
    return this.findById(id, options, manager);
  }

  /**
   * 조건으로 엔티티 업데이트 후 반환
   */
  async findOneAndUpdate(
    where: FindOptionsWhere<T>,
    updateDto: Partial<T>,
    options?: TypeOrmQueryOptions<T>,
    manager?: EntityManager,
  ): Promise<T | null> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    await repo.update(where, updateDto as any);
    return this.findOne(where, options, manager);
  }

  /**
   * 단일 엔티티 업데이트
   */
  async updateOne(
    where: FindOptionsWhere<T>,
    updateDto: Partial<T>,
    manager?: EntityManager,
  ): Promise<UpdateResult> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    const result = await repo.update(where, updateDto as any);
    return {
      affected: result.affected || 0,
      raw: result.raw,
    };
  }

  /**
   * 여러 엔티티 업데이트
   */
  async updateMany(
    where: FindOptionsWhere<T>,
    updateDto: Partial<T>,
    manager?: EntityManager,
  ): Promise<UpdateResult> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    const result = await repo.update(where, updateDto as any);
    return {
      affected: result.affected || 0,
      raw: result.raw,
    };
  }

  /**
   * ID로 엔티티 삭제 후 반환
   */
  async findByIdAndDelete(id: string | number, manager?: EntityManager): Promise<T | null> {
    const entity = await this.findById(id, undefined, manager);
    if (!entity) {
      return null;
    }
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    await repo.remove(entity);
    return entity;
  }

  /**
   * 조건으로 엔티티 삭제 후 반환
   */
  async findOneAndDelete(where: FindOptionsWhere<T>, manager?: EntityManager): Promise<T | null> {
    const entity = await this.findOne(where, undefined, manager);
    if (!entity) {
      return null;
    }
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    await repo.remove(entity);
    return entity;
  }

  /**
   * 조건으로 단일 엔티티 삭제
   */
  async deleteOne(where: FindOptionsWhere<T>, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    await repo.delete(where);
  }

  /**
   * 조건으로 여러 엔티티 삭제
   */
  async deleteMany(where: FindOptionsWhere<T>, manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    const result = await repo.delete(where);
    return result.affected || 0;
  }

  /**
   * 소프트 삭제 (isActive = false, deletedAt 설정)
   */
  async softDelete(id: string | number, manager?: EntityManager): Promise<T | null> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    await repo.update(id, {
      isActive: false,
      deletedAt: new Date(),
    } as any);
    return this.findById(id, undefined, manager);
  }

  /**
   * 조건으로 여러 엔티티 소프트 삭제
   */
  async softDeleteMany(where: FindOptionsWhere<T>, manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    const result = await repo.update(where, {
      isActive: false,
      deletedAt: new Date(),
    } as any);
    return result.affected || 0;
  }

  /**
   * 조건으로 엔티티 개수 조회
   */
  async count(where: FindOptionsWhere<T>, manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    return repo.count({ where });
  }

  /**
   * 조건으로 엔티티 존재 여부 확인
   */
  async exists(where: FindOptionsWhere<T>, manager?: EntityManager): Promise<boolean> {
    const count = await this.count(where, manager);
    return count > 0;
  }

  /**
   * 트랜잭션 실행
   */
  async withTransaction<R>(callback: (manager: EntityManager) => Promise<R>): Promise<R> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction().catch((err) => {
        this.logger.error('Rollback failed', err);
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============ TypeORM 전용 메서드 (인터페이스 외) ============

  /**
   * QueryBuilder를 사용한 집계 쿼리
   */
  async aggregate<R = any>(
    builderCallback: (qb: SelectQueryBuilder<T>) => SelectQueryBuilder<T>,
    manager?: EntityManager,
  ): Promise<R[]> {
    const repo = manager ? manager.getRepository<T>(this.repository.target) : this.repository;
    const qb = repo.createQueryBuilder('entity');
    return builderCallback(qb).getRawMany() as Promise<R[]>;
  }

  /**
   * ID로 관계 포함 조회
   */
  async findByIdWithRelations(
    id: string | number,
    relations: FindOptionsRelations<T>,
    options?: Omit<TypeOrmQueryOptions<T>, 'relations'>,
    manager?: EntityManager,
  ): Promise<T | null> {
    return this.findById(id, { ...options, relations }, manager);
  }

  /**
   * 조건으로 관계 포함 단일 조회
   */
  async findOneWithRelations(
    where: FindOptionsWhere<T>,
    relations: FindOptionsRelations<T>,
    options?: Omit<TypeOrmQueryOptions<T>, 'relations'>,
    manager?: EntityManager,
  ): Promise<T | null> {
    return this.findOne(where, { ...options, relations }, manager);
  }

  /**
   * 조건으로 관계 포함 다중 조회
   */
  async findWithRelations(
    where: FindOptionsWhere<T>,
    relations: FindOptionsRelations<T>,
    options?: Omit<TypeOrmQueryOptions<T>, 'relations'>,
    manager?: EntityManager,
  ): Promise<T[]> {
    return this.find(where, { ...options, relations }, manager);
  }

  /**
   * 관계 포함 페이징 조회
   */
  async findWithRelationsAndPagination(
    where: FindOptionsWhere<T>,
    relations: FindOptionsRelations<T>,
    paginationOptions: PaginationOptions,
    options?: Omit<TypeOrmQueryOptions<T>, 'relations'>,
    manager?: EntityManager,
  ): Promise<PaginatedResult<T>> {
    return this.findWithPagination(where, paginationOptions, { ...options, relations }, manager);
  }
}
