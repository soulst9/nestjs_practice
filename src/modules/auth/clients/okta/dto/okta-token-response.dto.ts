/**
 * Okta Token Endpoint 응답 DTO
 *
 * Authorization Code 교환 또는 Refresh Token 사용 시 받는 응답 형식
 *
 * @see https://developer.okta.com/docs/reference/api/oidc/#token
 */
export interface OktaTokenResponse {
  /**
   * API 접근용 Access Token
   * 만료 시간: 일반적으로 1시간
   */
  access_token: string;

  /**
   * Token 타입 (항상 "Bearer")
   */
  token_type: 'Bearer';

  /**
   * Access Token 만료 시간 (초 단위)
   * @example 3600 (1시간)
   */
  expires_in: number;

  /**
   * 인증된 사용자 정보를 담은 ID Token (JWT)
   * 클레임: sub, email, name, groups 등
   */
  id_token: string;

  /**
   * Access Token 갱신용 Refresh Token
   * Authorization Code Flow에서만 제공됨
   * @optional refresh_token grant에서는 반환되지 않을 수 있음
   */
  refresh_token?: string;

  /**
   * 부여된 권한 스코프 (공백으로 구분)
   * @example "openid profile email groups"
   */
  scope: string;
}
