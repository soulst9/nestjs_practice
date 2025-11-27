import { SetMetadata } from '@nestjs/common';

/**
 * 공개 키
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 공개 데코레이터
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);