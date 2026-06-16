import { apiFetch } from '@/lib/api';

export type Revenue = {
  cInvNo: string;
  invoiceDate?: string;
  cClientName?: string;
  cSalesmanName?: string;
  cContractID?: string;
  cJobNo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  cSiteID?: string;
  cStuctureID?: string;
  cStructureAddress?: string;
  cAcctNo?: string;
  cTitle?: string;
  invoiceAmount?: number;
  orNumber?: string | null;
  orAmount?: number | null;
  orDate?: string | null;
  cmdmTransactionNo?: string | null;
  cmdmAmount?: number | null;
  cLocation?: string;
  cBrandName?: string;
  cGroupName?: string;
  cReportGroup?: string;
  realizedRevenue?: number | string | null;
};

export type SavedRevenue = {
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

export type SavedRevenueMap = Record<string, SavedRevenue>;

export type RevenueRow = Revenue & {
  rowKey: string;
};

export async function fetchSavedRevenues(invoiceIds: string[]) {
  if (!invoiceIds.length) return {};

  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/revenue/savedRevenue`, {
    method: 'POST',
    body: JSON.stringify({
      invoice_ids: invoiceIds,
    }),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || json?.error || 'Failed to fetch saved revenue');
  }

  return json.data as SavedRevenueMap;
}

export async function fetchRevenues(from: string, to: string) {
  const res = await apiFetch(`https://api.unmg.com.ph/jv/revenue?from=${from}&to=${to}`);
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to fetch revenue');
  }

  const erpRows = json.data as Revenue[];

  const invoiceIds = Array.from(new Set(erpRows.map((row) => row.cInvNo).filter(Boolean)));

  const savedRevenueMap = await fetchSavedRevenues(invoiceIds);

  return erpRows.map((row, index) => ({
    ...row,
    rowKey: `${row.cInvNo?.trim() || ''}-${row.cContractID?.trim() || ''}-${row.cJobNo?.trim() || ''}-${index}`,
    realizedRevenue: savedRevenueMap[row.cInvNo]?.amount ?? '',
  })) as RevenueRow[];
}

export async function saveRealizedRevenues(rows: RevenueRow[], moaSharedId?: number | null) {
  const payloadRows = rows
    .filter((row) => row.realizedRevenue !== '' && row.realizedRevenue !== null && row.realizedRevenue !== undefined)
    .map(({ realizedRevenue, rowKey, ...row }) => {
      void rowKey;

      return {
        ...row,
        moa_shared_id: moaSharedId ?? null,
        realized_revenue: Number(realizedRevenue),
      };
    });

  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/revenue/realizedRevenue`, {
    method: 'POST',
    body: JSON.stringify({ rows: payloadRows }),
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || json?.error || 'Failed to save realized revenue');
  }

  return json;
}
