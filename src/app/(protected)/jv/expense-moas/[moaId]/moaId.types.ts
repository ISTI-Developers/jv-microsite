export interface ExpensePayload {
  id: number | null;
  location_id: number;
  account_no: string | number;
  particulars: string;
  amount: number;
  due_date: string | null;
  ref_no: string;
  payee: string;
}
