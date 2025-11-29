import { CreateUserDto } from '../../users/dto/create-user.dto';

/**
 * 사용자 정보 (Auth 모듈에서 필요한 최소 정보)
 */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  password: string;
  authProvider?: string;
  isActive: boolean;
}

/**
 * Auth 모듈이 필요로 하는 사용자 관련 기능 인터페이스
 * Users 모듈의 구현체로부터 분리
 */
export interface IUserProvider {
  /**
   * 이메일로 사용자 조회
   */
  findByEmail(email: string): Promise<AuthUser | null>;

  /**
   * 사용자 생성
   */
  createUser(dto: CreateUserDto): Promise<AuthUser>;
}

export const USER_PROVIDER = Symbol('USER_PROVIDER');
