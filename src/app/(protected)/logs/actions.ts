import { apiFetch } from '@/lib/api';

export type LogPagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type AuditLogRow = {
  id: number;
  log_type?: string | null;
  created_at: string | null;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  action: string | null;
  module?: string | null;
  module_or_type?: string | null;
  entity_type: string | null;
  entity_id: string | number | null;
  description: string | null;
  ip_address: string | null;
  reference_no?: string | null;
  amount?: string | number | null;
  metadata?: unknown;
};

export type AuditLogFilters = {
  page: number;
  limit: number;
  search?: string;
  user_id?: string;
  action?: string;
  module?: string;
  entity_type?: string;
  date_from?: string;
  date_to?: string;
};

export type AuditLogsResponse = {
  data: AuditLogRow[];
  pagination: LogPagination;
};

export async function fetchAuditLogs(filters: AuditLogFilters): Promise<AuditLogsResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/audit-logs?${searchParams.toString()}`);
  const data: AuditLogsResponse & { message?: string; error?: string } = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch audit logs');
  }

  return data;
}

export type TransactionLogRow = {
  id: number;
  log_type?: string | null;
  created_at: string | null;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  transaction_type: string | null;
  action: string | null;
  reference_table: string | null;
  reference_no: string | null;
  moa_id: string | number | null;
  moa_share_id: string | number | null;
  structure_id: string | number | null;
  account_no: string | number | null;
  amount: string | number | null;
  description: string | null;
  module_or_type?: string | null;
  metadata?: unknown;
};

export type TransactionLogFilters = {
  page: number;
  limit: number;
  search?: string;
  transaction_type?: string;
  action?: string;
  reference_table?: string;
  reference_no?: string;
  moa_id?: string;
  moa_share_id?: string;
  structure_id?: string;
  account_no?: string;
  performed_by?: string;
  date_from?: string;
  date_to?: string;
};

export type TransactionLogsResponse = {
  data: TransactionLogRow[];
  pagination: LogPagination;
};

export async function fetchTransactionLogs(filters: TransactionLogFilters): Promise<TransactionLogsResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/transaction-logs?${searchParams.toString()}`);
  const data: TransactionLogsResponse & { message?: string; error?: string } = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch transaction logs');
  }

  return data;
}

export type MoaActivityLogRow = {
  id: number;
  log_type: string | null;
  created_at: string | null;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  action: string | null;
  module_or_type: string | null;
  description: string | null;
  reference_no: string | null;
  amount: string | number | null;
  metadata?: unknown;
};

export type MoaActivityLogFilters = {
  moa_id: string | number;
  page: number;
  limit: number;
  search?: string;
  type?: 'audit' | 'transaction' | 'all';
  action?: string;
  date_from?: string;
  date_to?: string;
};

export type MoaActivityLogsResponse = {
  data: MoaActivityLogRow[];
  pagination: LogPagination;
};

export async function fetchMoaActivityLogs(filters: MoaActivityLogFilters): Promise<MoaActivityLogsResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && !(key === 'type' && value === 'all')) {
      searchParams.set(key, String(value));
    }
  });

  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/moa/activity-logs?${searchParams.toString()}`);
  const data: MoaActivityLogsResponse & { message?: string; error?: string } = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch MOA activity logs');
  }

  return data;
}

export type UserActivityLogRow = {
  id: number;
  log_type: string | null;
  created_at: string | null;
  action: string | null;
  module_or_type: string | null;
  description: string | null;
  reference_no: string | null;
  amount: string | number | null;
  metadata?: unknown;
};

export type UserActivityLogFilters = {
  user_id: string | number;
  page: number;
  limit: number;
  search?: string;
  type?: 'audit' | 'transaction' | 'all';
  action?: string;
  date_from?: string;
  date_to?: string;
};

export type UserActivityLogsResponse = {
  data: UserActivityLogRow[];
  pagination: LogPagination;
};

export async function fetchUserActivityLogs(filters: UserActivityLogFilters): Promise<UserActivityLogsResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && !(key === 'type' && value === 'all')) {
      searchParams.set(key, String(value));
    }
  });

  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/activity-logs?${searchParams.toString()}`);
  const data: UserActivityLogsResponse & { message?: string; error?: string } = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch user activity logs');
  }

  return data;
}
