import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import oktaConfig, { OktaConfig } from '../../../../common/config/okta.config';
import { winstonLogger } from '../../../../common/interceptors/winston-logger.config';
import { OktaTokenResponse } from './dto/okta-token-response.dto';
import { OktaUserInfo } from './dto/okta-user-info.dto';

/**
 * Okta HTTP Client Service
 *
 * Okta OAuth 2.0 API와의 HTTP 통신만 담당합니다.
 * 비즈니스 로직(사용자 생성, JWT 발급 등)은 AuthService에서 처리합니다.
 *
 * @example
 * // Authorization Code 교환
 * const tokens = await oktaClient.exchangeCodeForTokens(code);
 *
 * // Access Token 갱신
 * const newTokens = await oktaClient.refreshAccessToken(refreshToken);
 *
 * // 사용자 정보 조회
 * const userInfo = await oktaClient.getUserInfo(accessToken);
 */
@Injectable()
export class OktaHttpClientService {
  private readonly logger = winstonLogger;

  constructor(
    private readonly httpService: HttpService,
    @Inject(oktaConfig.KEY) private readonly config: OktaConfig,
  ) {}

  /**
   * Authorization Code를 Access Token으로 교환
   *
   * OAuth 2.0 Authorization Code Flow의 token endpoint 호출
   *
   * @param code - Okta callback으로 받은 authorization code
   * @returns Access token, refresh token, id token 포함한 응답
   *
   * @see https://developer.okta.com/docs/reference/api/oidc/#token
   */
  async exchangeCodeForTokens(code: string): Promise<OktaTokenResponse> {
    const tokenUrl = `${this.config.issuer}/v1/token`;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.callbackURL,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      this.logger.info(`Exchanging authorization code for tokens at ${tokenUrl}`);

      const response = await firstValueFrom(
        this.httpService.post<OktaTokenResponse>(
          tokenUrl,
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            timeout: 10000, // 10초 타임아웃
          }
        )
      );

      this.logger.info('Successfully exchanged code for tokens');
      return response.data;
    } catch (error) {
      this.handleOktaError('exchangeCodeForTokens', error);
    }
  }

  /**
   * Refresh Token으로 새로운 Access Token 발급
   *
   * @param refreshToken - 기존에 발급받은 refresh token
   * @returns 새로운 access token, id token 포함한 응답
   *
   * @see https://developer.okta.com/docs/reference/api/oidc/#token
   */
  async refreshAccessToken(refreshToken: string): Promise<OktaTokenResponse> {
    const tokenUrl = `${this.config.issuer}/v1/token`;

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: this.config.scope || 'openid profile email',
    });

    try {
      this.logger.info('Refreshing access token');

      const response = await firstValueFrom(
        this.httpService.post<OktaTokenResponse>(
          tokenUrl,
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            timeout: 10000,
          }
        )
      );

      this.logger.info('Successfully refreshed access token');
      return response.data;
    } catch (error) {
      this.handleOktaError('refreshAccessToken', error);
    }
  }

  /**
   * Access Token으로 사용자 정보 조회
   *
   * @param accessToken - 유효한 access token
   * @returns Okta 사용자 프로필 정보
   *
   * @see https://developer.okta.com/docs/reference/api/oidc/#userinfo
   */
  async getUserInfo(accessToken: string): Promise<OktaUserInfo> {
    const userInfoUrl = `${this.config.issuer}/v1/userinfo`;

    try {
      this.logger.info('Fetching user info from Okta');

      const response = await firstValueFrom(
        this.httpService.get<OktaUserInfo>(userInfoUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
          timeout: 10000,
        })
      );

      this.logger.info('Successfully fetched user info');
      return response.data;
    } catch (error) {
      this.handleOktaError('getUserInfo', error);
    }
  }

  /**
   * Token 폐기 (로그아웃 시 사용)
   *
   * @param token - 폐기할 access token 또는 refresh token
   * @param tokenTypeHint - 'access_token' 또는 'refresh_token'
   *
   * @see https://developer.okta.com/docs/reference/api/oidc/#revoke
   */
  async revokeToken(
    token: string,
    tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token'
  ): Promise<void> {
    const revokeUrl = `${this.config.issuer}/v1/revoke`;

    const params = new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      this.logger.info(`Revoking ${tokenTypeHint}`);

      await firstValueFrom(
        this.httpService.post(revokeUrl, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          timeout: 10000,
        })
      );

      this.logger.info('Successfully revoked token');
    } catch (error) {
      this.handleOktaError('revokeToken', error);
    }
  }

  /**
   * Okta API 에러 핸들링
   *
   * Okta의 표준 에러 응답을 파싱하고 적절한 로그를 남깁니다.
   *
   * @throws Error with detailed message
   */
  private handleOktaError(operation: string, error: any): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data = error.response?.data;

      this.logger.error(`Okta ${operation} failed`, {
        status,
        error: data?.error,
        errorDescription: data?.error_description,
        message: error.message,
      });

      throw new Error(
        `Okta ${operation} failed: ${data?.error_description || error.message}`
      );
    }

    this.logger.error(`Okta ${operation} unexpected error`, error);
    throw new Error(`Okta ${operation} failed: ${error.message}`);
  }
}
