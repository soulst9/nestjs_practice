import { RoleType } from '../enums/role.enum';

/**
 * 사용자 프로필
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: RoleType;
}

/**
 * 사용자 페이로드
 */
export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: RoleType;
  avatar?: string;
}

/**
 * SSO 토큰
 */
export interface SSOTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
}

/**
 * SSO 제공자
 */
// export interface SSOProvider {
//   // login(email: string, password: string): Promise<UserPayload>;
//   validateUser(profile: UserProfile, tokens?: SSOTokens): Promise<UserPayload>;
// }