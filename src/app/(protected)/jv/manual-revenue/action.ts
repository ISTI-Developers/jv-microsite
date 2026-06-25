import { Category } from '@/app/types/moa';
import { apiFetch } from '@/lib/api';
import { JvManualRevenueMoaData, JvManualRevenueMoaListItem, JvManualRevenuePayload, RevenueAccountTitle } from './types';

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
};

const getJson = async <T>(res: Response): Promise<T | null> => {
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
};

const isAccountEnabled = (item: RevenueAccountTitle) => item.is_enabled === undefined || item.is_enabled === null || Number(item.is_enabled) === 1;

export async function fetchJvMoaDetail(moaId: string | number) {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/moa/show?id=${moaId}`);
  const json = await getJson<ApiResponse<JvManualRevenueMoaData> & Partial<JvManualRevenueMoaData>>(res);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || 'Failed to fetch MOA details');
  }

  return (json?.data ?? json) as JvManualRevenueMoaData;
}

export async function fetchJvRevenueAccountTitles() {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/master-list/revenue-account-titles`);
  const json = await getJson<ApiResponse<RevenueAccountTitle[]>>(res);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || 'Failed to fetch revenue account titles');
  }

  return (json?.data ?? [])
    .filter(isAccountEnabled)
    .map<Category>((item) => ({
      id: Number(item.account_no),
      name: item.account_title,
    }))
    .filter((item) => Number.isFinite(item.id));
}

export async function fetchJvMoaList() {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/moa`);
  const json = await getJson<ApiResponse<JvManualRevenueMoaListItem[]>>(res);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || 'Failed to fetch MOAs');
  }

  return json?.data ?? [];
}

export async function syncJvManualRevenue(moaId: string | number, upserts: JvManualRevenuePayload[], deletes: number[]) {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/revenue/sync`, {
    method: 'POST',
    body: JSON.stringify({
      moa_id: Number(moaId),
      upserts,
      deletes,
    }),
  });
  const json = await getJson<ApiResponse<unknown>>(res);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || 'Failed to save JV manual revenue');
  }

  return json;
}
