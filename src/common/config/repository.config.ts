/**
 * 페이징 기본값
 */
export const PaginationDefaults = {
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 100,
  defaultSort: { createdAt: -1 }
} as const;
