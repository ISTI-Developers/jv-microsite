import { apiFetch } from '@/lib/api';

export type AccessMenu = {
  id: number;
  label: string;
  path: string | null;
  parent_id: number | null;
  display_order: number;
  role_allowed: number;
  user_override: 'allow' | 'deny' | null;
};

export type AccessAction = {
  id: number;
  code: string;
  label: string;
  menu_id: number | null;
  menu_label: string | null;
  role_allowed: number;
  user_override: 'allow' | 'deny' | null;
};
export type AccessUserOverride = {
  menu_id?: number;
  permission_id?: number;
  type: 'allow' | 'deny';
};

export type AccessUser = {
  id: number;
  email: string;
  role_id: number;
  role_name: string;
  is_active: number;
  profile: {
    user_id: number;
    first_name: string | null;
    last_name: string | null;
    entity_type: string | null;
    company_name: string | null;
    updated_at: string | null;
  } | null;
};
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function saveUserMenuAccess(userId: number, overrides: AccessUserOverride[]) {
  const res = await apiFetch(`${API_URL}/admin/access/menus/save`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      overrides,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to save user menu access');
  }

  return data;
}

export async function saveUserActionAccess(userId: number, overrides: AccessUserOverride[]) {
  const res = await apiFetch(`${API_URL}/admin/access/actions/save`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      overrides,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to save user action access');
  }

  return data;
}

export async function fetchJVUsers() {
  const res = await apiFetch(`${API_URL}/admin/users/jvusers`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch JV users');
  }

  return data.users as AccessUser[];
}

export async function fetchAdminUsers() {
  const res = await apiFetch(`${API_URL}/admin/users/adminusers`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch Admin users');
  }

  return data.users as AccessUser[];
}

export async function fetchMenuAccess(params: { roleId?: number; userId?: number }) {
  const searchParams = new URLSearchParams();

  if (params.roleId) {
    searchParams.set('role_id', String(params.roleId));
  }

  if (params.userId) {
    searchParams.set('user_id', String(params.userId));
  }

  const res = await apiFetch(`${API_URL}/admin/access/menus?${searchParams.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch menu access');
  }

  return data.data as AccessMenu[];
}

export async function saveRoleMenuAccess(roleId: number, menuIds: number[]) {
  const res = await apiFetch(`${API_URL}/admin/access/menus/save`, {
    method: 'POST',
    body: JSON.stringify({
      role_id: roleId,
      menu_ids: menuIds,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to save menu access');
  }

  return data;
}

export async function fetchActionAccess(params: { roleId?: number; userId?: number }) {
  const searchParams = new URLSearchParams();

  if (params.roleId) {
    searchParams.set('role_id', String(params.roleId));
  }

  if (params.userId) {
    searchParams.set('user_id', String(params.userId));
  }

  const res = await apiFetch(`${API_URL}/admin/access/actions?${searchParams.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch action access');
  }

  return data.data as AccessAction[];
}

export async function saveRoleActionAccess(roleId: number, permissionIds: number[]) {
  const res = await apiFetch(`${API_URL}/admin/access/actions/save`, {
    method: 'POST',
    body: JSON.stringify({
      role_id: roleId,
      permission_ids: permissionIds,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to save action access');
  }

  return data;
}
