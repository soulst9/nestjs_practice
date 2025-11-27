/**
 * Okta UserInfo Endpoint 응답 DTO
 *
 * Access Token으로 사용자 프로필 정보를 조회할 때 받는 응답 형식
 *
 * @see https://developer.okta.com/docs/reference/api/oidc/#userinfo
 */
export interface OktaUserInfo {
  /**
   * 사용자 고유 식별자 (Subject)
   * Okta User ID와 동일
   */
  sub: string;

  /**
   * 이메일 주소
   */
  email?: string;

  /**
   * 이메일 인증 여부
   */
  email_verified?: boolean;

  /**
   * 사용자 이름
   */
  name?: string;

  /**
   * Given name (이름)
   */
  given_name?: string;

  /**
   * Family name (성)
   */
  family_name?: string;

  /**
   * 로케일 정보
   * @example "ko-KR", "en-US"
   */
  locale?: string;

  /**
   * 프로필 사진 URL
   */
  picture?: string;

  /**
   * Okta username
   */
  preferred_username?: string;

  /**
   * 업데이트 시각 (Unix timestamp)
   */
  updated_at?: number;

  /**
   * 시간대 정보
   * @example "America/Los_Angeles"
   */
  zoneinfo?: string;

  /**
   * 사용자 그룹 정보 (Okta Groups Claim 활성화 시)
   * @optional 커스텀 authorization server 설정 필요
   */
  groups?: string[];
}
