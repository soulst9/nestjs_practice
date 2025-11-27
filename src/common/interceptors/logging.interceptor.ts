import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { winstonLogger } from './winston-logger.config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = winstonLogger;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const ip = headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown';


    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // 요청 로그
    this.logger.info('Incoming Request', {
      requestId,
      method,
      url,
      body: this.sanitizeBody(body),
      query,
      params,
      userAgent,
      ip,
    });

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          // 응답 로그
          this.logger.info('Outgoing Response', {
            requestId,
            method,
            url,
            statusCode: response.statusCode,
            responseTime: `${responseTime}ms`,
            // responseBody
          });
        },
        error: (error) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          // 에러 로그
          this.logger.error('Request Error', {
            requestId,
            method,
            url,
            statusCode: response.statusCode || 500,
            responseTime: `${responseTime}ms`,
            error: error.message,
            stack: error.stack,
          });
        },
      }),
    );
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    });
    
    return sanitized;
  }

  // private sanitizeResponse(response: any): any {
  //   if (typeof response === 'object' && response !== null) {
  //     try {
  //       // 순환 참조 감지 및 처리
  //       const responseStr = JSON.stringify(response);
  //       if (responseStr.length > 1000) {
  //         return '[Large Response Object]';
  //       }
  //       return JSON.parse(responseStr);
  //     } catch (error) {
  //       return '[Circular Reference Detected]';
  //     }
  //   }
  //   return response;
  // }
}