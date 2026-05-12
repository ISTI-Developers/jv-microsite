import { apiFetch } from '@/lib/api';

export type RevenueListRow = {
  id: number;
  moa_shared_id: number | null;
  user_id: number;
  invoice_id: string | null;
  account_no: string | null;
  transaction_no: string | null;
  job_number: string | null;
  due_date_from: string | null;
  due_date_to: string | null;
  structure_id: string | null;
  site_id: string | null;
  amount: string | number | null;
  remarks: string | null;
  group_name: string | null;
  date_created: string | null;
};

export type RevenueListResponse = {
  success: boolean;
  data: RevenueListRow[];
  message?: string;
};
export async function fetchRevenueList(): Promise<RevenueListRow[]> {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/list/revenue-list`);
  const json: RevenueListResponse = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to fetch revenue list');
  }

  return json.data;
}
