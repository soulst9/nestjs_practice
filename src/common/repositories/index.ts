// Interfaces
export {
  BaseRepository,
  PaginationOptions,
  PaginatedResult,
  UpdateResult,
} from './interfaces/base-repository.interface';

// Implementations
export { MongooseRepository } from './mongoose.repository';
export { TypeOrmRepository } from './typeorm.repository';
