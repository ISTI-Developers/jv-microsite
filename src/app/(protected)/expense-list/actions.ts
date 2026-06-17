import { apiFetch } from '@/lib/api';

export type ExpenseListRow = {
  id: number;
  external_key: string;
  source_type: 'JV' | 'UNAI' | string;
  source_id: number | string;
  moa_shared_id: number | null;
  account_no: string | null;
  user_id: number;
  ref_no: string | null;
  job_number: string | null;
  due_date_from: string | null;
  due_date_to: string | null;
  structure_id: string | null;
  payee: string | null;
  particulars: string | null;
  jv_amount: string | number | null;
  un_amount: string | number | null;
  group_name: string | null;
};

export type ExpenseListResponse = {
  success: boolean;
  data: ExpenseListRow[];
  message?: string;
};
export async function fetchExpenseList(): Promise<ExpenseListRow[]> {
  const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/jv/list/expense-list`);
  const json: ExpenseListResponse = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to fetch expense list');
  }

  return json.data;
}
