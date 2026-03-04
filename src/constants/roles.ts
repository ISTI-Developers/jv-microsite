export enum Roles {
  SUPER_USER = 1,
  ADMIN = 2,
  JOINT_VENTURE = 3,
}

export const ROLE_LABELS: Record<number, string> = {
  [Roles.SUPER_USER]: 'Super User',
  [Roles.ADMIN]: 'Admin',
  [Roles.JOINT_VENTURE]: 'Joint Venture',
};

export const ADMIN_ROLES: number[] = [Roles.SUPER_USER, Roles.ADMIN];
