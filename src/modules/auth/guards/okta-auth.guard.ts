import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OktaAuthGuard extends AuthGuard('okta') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Okta 에러가 있으면 Controller로 넘김 (Guard 통과)
    if (request.query?.error) {
      return true;
    }

    // 정상 플로우는 Passport Strategy 실행
    return super.canActivate(context);
  }
}