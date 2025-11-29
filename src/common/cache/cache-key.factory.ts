/**
 * 캐시 키 생성 팩토리
 * 모든 캐시 키를 중앙에서 관리하여 일관성 유지
 */
export const CacheKeyFactory = {
  /**
   * User 도메인 캐시 키
   */
  user: {
    byId: (id: string) => `user:id:${id}`,
    byEmail: (email: string) => `user:email:${email}`,
    list: (page: number, limit: number) => `user:list:${page}:${limit}`,
  },

  /**
   * Auth 도메인 캐시 키
   */
  auth: {
    session: (userId: string) => `auth:session:${userId}`,
    refreshToken: (userId: string) => `auth:refresh:${userId}`,
  },

  /**
   * 패턴 기반 키 (삭제용)
   */
  patterns: {
    user: (id: string) => `user:*:${id}`,
    allUsers: () => 'user:*',
  },
} as const;
