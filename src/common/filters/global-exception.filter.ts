import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RedisConnectionFailedException } from '../exceptions/redis.exception';

@Catch() // 모든 예외를 캐치
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message = typeof errorResponse === 'string' 
        ? errorResponse 
        : (errorResponse as any).message || 'HTTP Exception';
    } else if (exception instanceof RedisConnectionFailedException) {
      process.exit(1);
    } else {
      // 예상하지 못한 에러의 경우
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    // 에러 응답 생성
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(process.env.NODE_ENV === 'development' && {
        error: exception instanceof Error ? exception.message : exception,
      }),
      message: message,
    };

    response.status(status).json(errorResponse);
  }
}