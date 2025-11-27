import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UserDocument } from '../schemas/user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { RedisService } from 'src/common/redis/redis.service';
import { repositoryCache } from 'src/utils/cache-aside.util';
import { winstonLogger } from 'src/common/interceptors/winston-logger.config';
import { UserRoleInfo } from 'src/common/interfaces/sso-provider.interface';
import { Types } from 'mongoose';
import { Role, RoleType } from 'src/common/enums/role.enum';

@Injectable()
export class UsersService {
  private readonly logger = winstonLogger;
  private readonly userRepositoryCache: ReturnType<typeof repositoryCache<UserDocument>>;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userRoleRepository: UserRoleRepository,
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
    const options = session ? { session } : {};
    const user = await this.userRepository.findOrCreate(filterQuery, createUserDto, false, options);
    return user as UserDocument;
  }

  /**
   * 사용자 생성 (캐시 포함)
   * @param createUserDto 사용자 생성 정보
   * @returns 캐시에 저장 후 반환
   */
  async createUserWithCache(createUserDto: CreateUserDto): Promise<UserDocument> {
    // 비즈니스 로직: 이메일 중복 체크
    const existingUser = await this.findByEmail({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('Already exists email.');
    }

    const cacheKey = `user:${createUserDto.email}`;
    const createOperation = () => this.userRepository.create({
      ...createUserDto,
      isActive: true
    });

    // 사용자 생성
    const user = await this.userRepositoryCache.createWithCache(cacheKey, createOperation);
    return user as UserDocument;
  }

  /**
   * 사용자 조회 (ID로, 캐시 포함) - null 허용
   * @param id 사용자 ID
   * @param projection 선택할 필드 (옵션)
   * @returns 조회된 사용자 또는 null
   */
  async findByIdWithCache(id: string, projection?: Record<string, 1 | 0>): Promise<UserDocument | null> {
    const cacheKey = `user:${id}`;
    const findOperation = () => this.userRepository.findById(id, projection);
    return this.userRepositoryCache.findWithCache<UserDocument | null>(cacheKey, findOperation);
  }

  /**
   * 사용자 조회 (이메일)
   * @param email 사용자 이메일
   * @returns 조회된 사용자
   */
  async findByEmail({ email }: { email: string }): Promise<UserDocument | null> {
    return await this.userRepository.findOne({ email, isActive: true });
  }
}