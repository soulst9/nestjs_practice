import { Injectable, ConflictException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UserDocument } from '../schemas/user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { RedisService } from 'src/common/redis/redis.service';
import { repositoryCache } from 'src/utils/cache-aside.util';
import { UserProvider, AuthUser } from '../../auth/interfaces/user-provider.interface';
import { CacheKeyFactory } from 'src/common/cache/cache-key.factory';

@Injectable()
export class UsersService implements UserProvider {
  private readonly userRepositoryCache: ReturnType<typeof repositoryCache<UserDocument>>;

  constructor(
    private readonly userRepository: UserRepository,
    // private readonly userRoleRepository: UserRoleRepository,
    private readonly redisService: RedisService,
  ) {
    this.userRepositoryCache = repositoryCache(userRepository, redisService);
  }


  /**
   * 사용자 조회 또는 생성
   * @param createUserDto 사용자 생성 정보
   * @param session MongoDB 세션 (트랜잭션용)
   * @returns 조회된 사용자 또는 생성된 사용자
   */
  async findOrCreateUser(createUserDto: CreateUserDto, session?: any): Promise<UserDocument> {
    const filterQuery = { email: createUserDto.email };
    const user = await this.userRepository.findOrCreate(filterQuery, createUserDto, session);
    return user as UserDocument;
  }

  /**
   * 사용자 생성 (캐시 포함)
   */
  async createUserWithCache(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Already exists email.');
    }

    const cacheKey = CacheKeyFactory.user.byEmail(createUserDto.email);
    const createOperation = () => this.userRepository.create({
      ...createUserDto,
      isActive: true
    });

    const user = await this.userRepositoryCache.createWithCache(cacheKey, createOperation);
    return user as UserDocument;
  }

  /**
   * 사용자 조회 (ID로, 캐시 포함)
   */
  async findByIdWithCache(id: string, projection?: Record<string, 1 | 0>): Promise<UserDocument | null> {
    const cacheKey = CacheKeyFactory.user.byId(id);
    const findOperation = () => this.userRepository.findById(id, projection);
    return this.userRepositoryCache.findWithCache<UserDocument | null>(cacheKey, findOperation);
  }

  /**
   * IUserProvider 구현: 이메일로 사용자 조회
   */
  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.userRepository.findOne({ email, isActive: true });
    if (!user) return null;

    return this.toAuthUser(user);
  }

  /**
   * IUserProvider 구현: 사용자 생성
   */
  async createUser(dto: CreateUserDto): Promise<AuthUser> {
    const user = await this.createUserWithCache(dto);
    return this.toAuthUser(user);
  }

  /**
   * UserDocument → AuthUser 변환
   */
  private toAuthUser(user: UserDocument): AuthUser {
    return {
      id: (user._id as string).toString(),
      username: user.username,
      email: user.email,
      password: user.password,
      authProvider: user.authProvider,
      isActive: user.isActive,
    };
  }
}