import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RoleType } from '../enums/role.enum';

/**
 * 현재 사용자 데이터
 */
export interface CurrentUserData {
  userId: string;
  email: string;
  name: string;
  role: RoleType;
  provider: string;
}

/**
 * 현재 사용자 데이터 데코레이터
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);