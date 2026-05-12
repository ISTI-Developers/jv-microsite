import { apiFetch } from '@/lib/api';

export type RevenueList = {
  invoice_id: number;
  job_number: string;
  reference_date: string;
  structure_id: number;
  address: string;
  Customer_Name: string;
  Product: string;
  project: string;
  date_from: string;
  date_to: string;
  collectionAmount?: number | string;
};

export type SavedCollection = {
  id: number;
  invoice_id: string;
  amount: number | null;
  user_id: number | null;
  date_created?: string | null;
  user?: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
  };
};

export type SavedCollectionMap = Record<string, SavedCollection>;

type GetJVLocationsResponse = {
  data: number[];
  error?: string;
};

type GetJVRevenueResponse = {
  success: boolean;
  data: RevenueList[];
  error?: string;
};

export async function fetchSavedJVCollections(invoiceIds: string[]) {
  if (!invoiceIds.length) return {};

  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/collection/jvSavedInput`, {
    method: 'POST',
    body: JSON.stringify({
      invoice_ids: invoiceIds,
    }),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || json?.error || 'Failed to fetch saved collection input');
  }

  return json.data as SavedCollectionMap;
}

export async function fetchJVRevenues(): Promise<RevenueList[]> {
  const locationsRes = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/moa/jvLocations`);
  const locationsJson: GetJVLocationsResponse = await locationsRes.json();

  if (!locationsRes.ok) {
    throw new Error(locationsJson.error || 'Failed to fetch JV locations');
  }

  const params = new URLSearchParams({
    structure_ids: locationsJson.data.join(','),
  });

  const revenueRes = await fetch(`https://api.unmg.com.ph/jv/getRevenueOfJV?${params.toString()}`);
  const revenueJson: GetJVRevenueResponse = await revenueRes.json();

  if (!revenueRes.ok || !revenueJson.success) {
    throw new Error(revenueJson.error || 'Failed to fetch revenue');
  }

  const revenueRows = revenueJson.data;

  const invoiceIds = Array.from(new Set(revenueRows.map((row) => String(row.invoice_id)).filter(Boolean)));

  const savedCollectionMap = await fetchSavedJVCollections(invoiceIds);

  return revenueRows.map((row) => ({
    ...row,
    collectionAmount: savedCollectionMap[String(row.invoice_id)]?.amount ?? '',
  }));
}

export async function saveJVCollectionInputs(rows: RevenueList[], moaSharedId?: number | null) {
  const payloadRows = rows
    .filter((row) => row.collectionAmount !== '' && row.collectionAmount !== null && row.collectionAmount !== undefined)
    .map(({ collectionAmount, ...row }) => ({
      ...row,
      moa_shared_id: moaSharedId ?? null,
      collection_amount: Number(collectionAmount),
    }));

  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/collection/jvCollectionInput`, {
    method: 'POST',
    body: JSON.stringify({
      rows: payloadRows,
    }),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || json?.error || 'Failed to save JV collection input');
  }

  return json;
}
