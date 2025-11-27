import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { winstonLogger } from '../../interceptors/winston-logger.config';

/**
 * 범용 HTTP Client Service
 *
 * 외부 API 통신을 위한 공통 HTTP 요청/응답 처리
 *
 * @example
 * // Okta API 호출
 * const response = await httpClient.post<TokenResponse>(
 *   'https://okta.com/oauth2/v1/token',
 *   { grant_type: 'authorization_code', code: '...' }
 * );
 */
@Injectable()
export class HttpClientService {
  private readonly logger = winstonLogger;
  private readonly defaultTimeout = 10000; // 10초

  constructor(private readonly httpService: HttpService) {}

  /**
   * HTTP GET 요청
   *
   * @param url - 요청 URL
   * @param config - Axios 요청 옵션
   * @returns 응답 데이터
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      this.logger.debug(`HTTP GET: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get<T>(url, {
          timeout: this.defaultTimeout,
          ...config,
        })
      );

      this.logger.debug(`HTTP GET success: ${url}`);
      return response.data;
    } catch (error) {
      this.handleHttpError('GET', url, error);
    }
  }

  /**
   * HTTP POST 요청
   *
   * @param url - 요청 URL
   * @param data - 요청 본문 데이터
   * @param config - Axios 요청 옵션
   * @returns 응답 데이터
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      this.logger.debug(`HTTP POST: ${url}`);

      const response = await firstValueFrom(
        this.httpService.post<T>(url, data, {
          timeout: this.defaultTimeout,
          ...config,
        })
      );

      this.logger.debug(`HTTP POST success: ${url}`);
      return response.data;
    } catch (error) {
      this.handleHttpError('POST', url, error);
    }
  }

  /**
   * HTTP PUT 요청
   *
   * @param url - 요청 URL
   * @param data - 요청 본문 데이터
   * @param config - Axios 요청 옵션
   * @returns 응답 데이터
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      this.logger.debug(`HTTP PUT: ${url}`);

      const response = await firstValueFrom(
        this.httpService.put<T>(url, data, {
          timeout: this.defaultTimeout,
          ...config,
        })
      );

      this.logger.debug(`HTTP PUT success: ${url}`);
      return response.data;
    } catch (error) {
      this.handleHttpError('PUT', url, error);
    }
  }

  /**
   * HTTP PATCH 요청
   *
   * @param url - 요청 URL
   * @param data - 요청 본문 데이터
   * @param config - Axios 요청 옵션
   * @returns 응답 데이터
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      this.logger.debug(`HTTP PATCH: ${url}`);

      const response = await firstValueFrom(
        this.httpService.patch<T>(url, data, {
          timeout: this.defaultTimeout,
          ...config,
        })
      );

      this.logger.debug(`HTTP PATCH success: ${url}`);
      return response.data;
    } catch (error) {
      this.handleHttpError('PATCH', url, error);
    }
  }

  /**
   * HTTP DELETE 요청
   *
   * @param url - 요청 URL
   * @param config - Axios 요청 옵션
   * @returns 응답 데이터
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      this.logger.debug(`HTTP DELETE: ${url}`);

      const response = await firstValueFrom(
        this.httpService.delete<T>(url, {
          timeout: this.defaultTimeout,
          ...config,
        })
      );

      this.logger.debug(`HTTP DELETE success: ${url}`);
      return response.data;
    } catch (error) {
      this.handleHttpError('DELETE', url, error);
    }
  }

  /**
   * HTTP 에러 핸들링
   *
   * 일관된 에러 로깅 및 변환
   * 각 모듈에서 필요시 추가 처리 가능
   *
   * @param method - HTTP 메서드
   * @param url - 요청 URL
   * @param error - 발생한 에러
   * @throws Error with detailed message
   */
  private handleHttpError(method: string, url: string, error: any): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data = error.response?.data;

      this.logger.error(`HTTP ${method} ${url} failed`, {
        status,
        statusText: error.response?.statusText,
        data,
        message: error.message,
      });

      // 구조화된 에러 메시지 생성
      const errorMessage = this.buildErrorMessage(method, url, status, data);
      throw new Error(errorMessage);
    }

    this.logger.error(`HTTP ${method} ${url} unexpected error`, error);
    throw new Error(`HTTP ${method} ${url} failed: ${error.message}`);
  }

  /**
   * 에러 메시지 생성
   *
   * @param method - HTTP 메서드
   * @param url - 요청 URL
   * @param status - HTTP 상태 코드
   * @param data - 응답 데이터
   * @returns 에러 메시지
   */
  private buildErrorMessage(
    method: string,
    url: string,
    status?: number,
    data?: any
  ): string {
    const parts = [`HTTP ${method} ${url} failed`];

    if (status) {
      parts.push(`(${status})`);
    }

    if (data?.error_description) {
      parts.push(`- ${data.error_description}`);
    } else if (data?.message) {
      parts.push(`- ${data.message}`);
    } else if (typeof data === 'string') {
      parts.push(`- ${data}`);
    }

    return parts.join(' ');
  }
}
