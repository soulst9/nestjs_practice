/**
 * 페이징 옵션 인터페이스
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1 | 'ASC' | 'DESC'>;
}

/**
 * 페이징 결과 인터페이스
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * 업데이트 결과 인터페이스
 */
export interface UpdateResult {
  affected: number;
  raw?: any;
}

/**
 * 공통 Repository 인터페이스
 * MongoDB와 PostgreSQL 모두 이 인터페이스를 구현
 */
export interface BaseRepository<T, ID = string | number> {
  // Create
  create(createDto: Partial<T>, context?: any): Promise<T>;
  createMany(createDtos: Partial<T>[], context?: any): Promise<T[]>;

  // Read
  findById(id: ID, options?: any, context?: any): Promise<T | null>;
  findOne(where: any, options?: any, context?: any): Promise<T | null>;
  find(where: any, options?: any, context?: any): Promise<T[]>;
  findOrCreate(where: any, createDto: Partial<T>, context?: any): Promise<T>;
  findWithPagination(
    where: any,
    paginationOptions: PaginationOptions,
    options?: any,
    context?: any,
  ): Promise<PaginatedResult<T>>;

  // Update
  findByIdAndUpdate(id: ID, updateDto: Partial<T>, options?: any, context?: any): Promise<T | null>;
  findOneAndUpdate(where: any, updateDto: Partial<T>, options?: any, context?: any): Promise<T | null>;
  updateOne(where: any, updateDto: Partial<T>, context?: any): Promise<UpdateResult>;
  updateMany(where: any, updateDto: Partial<T>, context?: any): Promise<UpdateResult>;

  // Delete
  findByIdAndDelete(id: ID, context?: any): Promise<T | null>;
  findOneAndDelete(where: any, context?: any): Promise<T | null>;
  deleteOne(where: any, context?: any): Promise<void>;
  deleteMany(where: any, context?: any): Promise<number>;

  // Soft Delete
  softDelete(id: ID, context?: any): Promise<T | null>;
  softDeleteMany(where: any, context?: any): Promise<number>;

  // Utility
  count(where: any, context?: any): Promise<number>;
  exists(where: any, context?: any): Promise<boolean>;

  // Transaction
  withTransaction<R>(callback: (context: any) => Promise<R>): Promise<R>;
}
