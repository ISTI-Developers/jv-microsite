import { Category } from '@/app/types/moa';
import { apiFetch } from '@/lib/api';
import { AccountTitle, AdminMoaListItem, UnaiManualExpensePayload, UnaiManualMoaData } from './types';

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type VoucherRow = {
  cTranNo?: string | null;
};

const getJson = async <T>(res: Response): Promise<T | null> => {
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
};

const isAccountEnabled = (item: AccountTitle) => item.is_enabled === undefined || item.is_enabled === null || Number(item.is_enabled) === 1;

export async function fetchAdminMoaDetail(moaId: string | number) {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/moa/show?moa_id=${moaId}`);
  const json = await getJson<ApiResponse<UnaiManualMoaData> & Partial<UnaiManualMoaData>>(res);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || 'Failed to fetch MOA details');
  }

  return (json?.data ?? json) as UnaiManualMoaData;
}

export async function fetchAdminAccountTitles() {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/master-list/account-titles`);
  const json = await getJson<ApiResponse<AccountTitle[]>>(res);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || 'Failed to fetch account titles');
  }

  return (json?.data ?? [])
    .filter(isAccountEnabled)
    .map<Category>((item) => ({
      id: Number(item.account_no),
      name: item.account_title,
    }))
    .filter((item) => Number.isFinite(item.id));
}

export async function fetchAdminMoaList() {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/moa`);
  const json = await getJson<ApiResponse<AdminMoaListItem[]>>(res);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || 'Failed to fetch MOAs');
  }

  return json?.data ?? [];
}

export async function searchVouchers(search: string) {
  const normalizedSearch = search.trim();

  if (normalizedSearch.length < 2) {
    return [];
  }

  try {
    const res = await fetch(`https://api.unmg.com.ph/jv/getVouchers?search=${encodeURIComponent(normalizedSearch)}`);
    const json = (await res.json()) as ApiResponse<VoucherRow[]>;

    if (!res.ok || !json?.success || !Array.isArray(json.data)) {
      return [];
    }

    return json.data.map((item) => String(item.cTranNo ?? '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function syncUnaiManualExpenses(moaId: string | number, upserts: UnaiManualExpensePayload[], deletes: number[]) {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/manual-expenses/sync`, {
    method: 'POST',
    body: JSON.stringify({
      moa_id: Number(moaId),
      upserts,
      deletes,
    }),
  });
  const json = await getJson<ApiResponse<unknown>>(res);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || 'Failed to save UNAI manual expenses');
  }

  return json;
}
