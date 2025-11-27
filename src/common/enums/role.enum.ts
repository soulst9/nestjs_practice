export const Role = {
  MEMBER: 100,
  ADMIN: 150,
} as const;

export type RoleType = typeof Role[keyof typeof Role];